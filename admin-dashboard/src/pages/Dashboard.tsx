import { useEffect, useState } from 'react';
import {
    Truck,
    DollarSign,
    Activity,
    TrendingUp,
    TrendingDown,
    Clock,
    ArrowUpRight,
    MoreVertical,
    Calendar
} from 'lucide-react';
import { adminAPI } from '../services/api';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

const Dashboard = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await adminAPI.getDashboard();
                setData(response.data.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 bg-white rounded-full"></div>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8 max-w-2xl">
            <div className="p-6 text-rose-600 bg-rose-50 rounded-3xl border border-rose-100 shadow-lg shadow-rose-100 flex items-center">
                <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center mr-4">⚠️</div>
                <div>
                    <p className="font-black text-rose-900">System Error</p>
                    <p className="text-sm opacity-80">{error}</p>
                </div>
            </div>
        </div>
    );

    const { overview, recentBookings, topDrivers } = data;

    const stats = [
        { label: 'Revenue', value: `₹${overview.totalRevenue.toLocaleString()}`, icon: DollarSign, trend: '+12.4%', up: true, color: 'bg-indigo-500' },
        { label: 'Drivers', value: overview.activeDrivers.toString(), icon: Activity, trend: '+5.1%', up: true, color: 'bg-emerald-500' },
        { label: 'Bookings', value: overview.totalBookings.toString(), icon: Truck, trend: '+18.2%', up: true, color: 'bg-blue-500' },
        { label: 'KYC Pending', value: overview.pendingKYC.toString(), icon: Clock, trend: '-2.4%', up: false, color: 'bg-amber-500' },
    ];

    // Dummy Chart Data
    const chartData = [
        { name: 'Mon', value: 4000 },
        { name: 'Tue', value: 3000 },
        { name: 'Wed', value: 2000 },
        { name: 'Thu', value: 2780 },
        { name: 'Fri', value: 1890 },
        { name: 'Sat', value: 2390 },
        { name: 'Sun', value: 3490 },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Portfolio Insights</h1>
                    <p className="text-slate-500 font-medium">Monitoring platform performance and logistics metrics.</p>
                </div>
                <div className="flex space-x-3">
                    <div className="hidden lg:flex items-center px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm h-12">
                        <Calendar className="h-4 w-4 text-slate-400 mr-3" />
                        <span className="text-sm font-bold text-slate-600">Jan 20, 2026 - Today</span>
                    </div>
                    <button className="h-12 px-6 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center group active:scale-95">
                        <ArrowUpRight className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <div key={index} className="glass-card glass-card-hover p-7 rounded-[2rem] relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 h-24 w-24 ${stat.color} opacity-[0.03] rounded-bl-[4rem] group-hover:scale-150 transition-transform duration-700`}></div>
                        <div className="flex items-center justify-between mb-6">
                            <div className={`h-12 w-12 rounded-2xl ${stat.color} bg-opacity-10 flex items-center justify-center text-white ring-1 ring-inset ring-white/10 group-hover:scale-110 transition-transform duration-500`}>
                                <stat.icon className={`h-6 w-6 ${stat.color === 'bg-indigo-500' ? 'text-indigo-600' : stat.color === 'bg-emerald-500' ? 'text-emerald-600' : stat.color === 'bg-blue-500' ? 'text-blue-600' : 'text-amber-600'}`} />
                            </div>
                            <button className="text-slate-300 hover:text-slate-600 transition-colors">
                                <MoreVertical size={18} />
                            </button>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                                <div className={`flex items-center px-2 py-1 rounded-lg text-[10px] font-bold ${stat.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {stat.up ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                                    {stat.trend}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Main Chart Section */}
                <div className="lg:col-span-8 glass-card rounded-[2.5rem] p-8">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Revenue Performance</h3>
                            <p className="text-sm text-slate-400 font-medium">Daily platform revenue trends</p>
                        </div>
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                            <button className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">Week</button>
                            <button className="px-5 py-2 bg-white text-xs font-black text-indigo-600 rounded-xl shadow-sm">Month</button>
                            <button className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">Year</button>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '20px',
                                        border: 'none',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                        fontWeight: '800'
                                    }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Drivers Panel */}
                <div className="lg:col-span-4 glass-card rounded-[2.5rem] p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900">Top Fleet</h3>
                        <button className="text-indigo-600 text-xs font-black uppercase tracking-wider hover:underline">View All</button>
                    </div>
                    <div className="flex-1 space-y-6">
                        {topDrivers.slice(0, 4).map((item: any, idx: number) => (
                            <div key={item._id} className="flex items-center justify-between group p-2 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer">
                                <div className="flex items-center">
                                    <div className="relative">
                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold border border-indigo-200 transition-transform group-hover:scale-110">
                                            {item.driver.name.charAt(0)}
                                        </div>
                                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-white rounded-full flex items-center justify-center border-2 border-indigo-50 shadow-sm">
                                            <span className="text-[10px] font-black">{idx + 1}</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-black text-slate-900 leading-tight">{item.driver.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.totalTrips} Completed Trips</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900">₹{item.totalEarnings.toLocaleString()}</p>
                                    <div className="flex items-center justify-end text-[10px] text-amber-500 font-black mt-0.5">
                                        ⭐ 4.9
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100/50">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Fleet Health</p>
                            <span className="text-xs font-black text-indigo-700">92%</span>
                        </div>
                        <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 w-[92%] rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tables Section */}
            <div className="glass-card rounded-[2.5rem] p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-8 px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">Recent Assignments</h3>
                        <p className="text-sm text-slate-400 font-medium">Latest live booking requests and statuses</p>
                    </div>
                    <button className="btn-secondary">Show all bookings</button>
                </div>
                <div className="overflow-x-auto selection:bg-indigo-100">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking ID</th>
                                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Details</th>
                                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</th>
                                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fare Asset</th>
                                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {recentBookings.map((booking: any) => (
                                <tr key={booking._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-6 font-black text-slate-900 text-sm">#{booking.bookingId}</td>
                                    <td className="px-4 py-6">
                                        <div className="flex items-center">
                                            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs mr-3">
                                                {booking.customer?.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 leading-none mb-1">{booking.customer?.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{new Date(booking.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6">
                                        <span className={`status-badge ${booking.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                booking.status === 'searching' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    booking.status === 'confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                            <div className={`h-1.5 w-1.5 rounded-full mr-2 ${booking.status === 'completed' ? 'bg-emerald-500' :
                                                    booking.status === 'searching' ? 'bg-blue-500' :
                                                        booking.status === 'confirmed' ? 'bg-indigo-500' : 'bg-slate-500'
                                                }`}></div>
                                            {booking.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-6">
                                        <p className="text-sm font-black text-slate-900">₹{booking.fare?.total}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{booking.vehicleType}</p>
                                    </td>
                                    <td className="px-4 py-6 text-right">
                                        <button className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-sm transition-all shadow-sm">
                                            <ArrowUpRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
