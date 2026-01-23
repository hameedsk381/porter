import Booking from '../models/Booking';
import User from '../models/User';
import Wallet from '../models/Wallet';
import dayjs from 'dayjs';

class AnalyticsService {
    async getDashboardStats() {
        const today = dayjs().startOf('day').toDate();
        const monthStart = dayjs().startOf('month').toDate();

        const [
            totalEarnings,
            todayEarnings,
            totalBookings,
            todayBookings,
            activeDrivers,
            newUsers
        ] = await Promise.all([
            // Total Revenue (Platform Commission 20%)
            Booking.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$fare.amount' } } }
            ]),
            // Today's Revenue
            Booking.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: today } } },
                { $group: { _id: null, total: { $sum: '$fare.amount' } } }
            ]),
            // Total Bookings
            Booking.countDocuments({}),
            // Today's Bookings
            Booking.countDocuments({ createdAt: { $gte: today } }),
            // Active Drivers
            User.countDocuments({ role: 'driver', 'driverProfile.isAvailable': true }),
            // New Users this month
            User.countDocuments({ createdAt: { $gte: monthStart } })
        ]);

        const platformTotalRevenue = (totalEarnings[0]?.total || 0) * 0.2;
        const platformTodayRevenue = (todayEarnings[0]?.total || 0) * 0.2;

        return {
            revenue: {
                total: platformTotalRevenue,
                today: platformTodayRevenue,
            },
            bookings: {
                total: totalBookings,
                today: todayBookings,
            },
            users: {
                activeDrivers,
                newUsersThisMonth: newUsers,
            },
            timestamp: new Date()
        };
    }

    async getRevenueChartData(days = 7) {
        const startDate = dayjs().subtract(days, 'day').startOf('day').toDate();

        const stats = await Booking.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$fare.amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        return stats.map(s => ({
            date: s._id,
            revenue: s.revenue * 0.2, // Platform commission
            trips: s.count
        }));
    }

    async getDriverPerformance(driverId: string) {
        const stats = await Booking.aggregate([
            { $match: { driverId: new mongoose.Types.ObjectId(driverId) } },
            {
                $group: {
                    _id: null,
                    totalTrips: { $sum: 1 },
                    completedTrips: {
                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                    },
                    cancelledTrips: {
                        $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
                    },
                    totalEarnings: {
                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$fare.amount", 0] }
                    },
                    avgRating: { $avg: "$rating" }
                }
            }
        ]);

        return stats[0] || {
            totalTrips: 0,
            completedTrips: 0,
            cancelledTrips: 0,
            totalEarnings: 0,
            avgRating: 0
        };
    }
}

import mongoose from 'mongoose';
export const analyticsService = new AnalyticsService();
export default analyticsService;
