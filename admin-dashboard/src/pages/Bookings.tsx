import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    User,
    Clock,
    ExternalLink,
    MapPin,
    Calendar,
    Filter,
    Download,
    AlertCircle
} from 'lucide-react';

const Bookings = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        fetchBookings();
    }, [page, status]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getBookings({ page, search, status });
            setBookings(res.data.data.bookings);
            setPagination(res.data.data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const statusConfig: Record<string, { label: string, color: string, iconColor: string }> = {
        pending: { label: 'Awaiting', color: 'bg-amber-50 text-amber-600 border-amber-100', iconColor: 'bg-amber-500' },
        searching: { label: 'Dispatching', color: 'bg-blue-50 text-blue-600 border-blue-100', iconColor: 'bg-blue-500' },
        confirmed: { label: 'Matched', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', iconColor: 'bg-indigo-500' },
        arrived: { label: 'At Pickup', color: 'bg-violet-50 text-violet-600 border-violet-100', iconColor: 'bg-violet-500' },
        in_progress: { label: 'In Transit', color: 'bg-orange-50 text-orange-600 border-orange-100', iconColor: 'bg-orange-500' },
        completed: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', iconColor: 'bg-emerald-500' },
        cancelled: { label: 'Aborted', color: 'bg-rose-50 text-rose-600 border-rose-100', iconColor: 'bg-rose-500' },
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Logbook</h1>
                    <p className="text-slate-500 font-medium">Historical and active booking transaction data.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="btn-secondary h-12">
                        <Download className="h-4 w-4 mr-2" />
                        Manifest
                    </button>
                    <button className="btn-primary h-12 bg-slate-900">
                        New Request
                    </button>
                </div>
            </div>

            {/* Control Strip */}
            <div className="glass-card p-6 rounded-[2rem] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="relative group w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Order ID, Customer, Address..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchBookings()}
                        />
                    </div>

                    <select
                        className="h-[46px] px-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-600 uppercase tracking-widest focus:ring-4 focus:ring-indigo-50 outline-none"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="">Status: All Filters</option>
                        <option value="pending">Pending</option>
                        <option value="searching">Searching</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Transit</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <div className="flex items-center space-x-2 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                    <Calendar className="h-3 w-3" />
                    <span>Sorting by Recency</span>
                </div>
            </div>

            {/* Table Section */}
            <div className="glass-card rounded-[2.5rem] overflow-hidden">
                {loading ? (
                    <div className="h-96 flex flex-col items-center justify-center space-y-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
                        <p className="text-sm font-bold text-slate-400 animate-pulse font-mono tracking-tighter">READING_LEDGER...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Details</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logistics Path</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">State</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Economics</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Utility</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {bookings.length === 0 ? (
                                        <tr><td colSpan={5} className="px-8 py-20 text-center font-black text-slate-300 text-lg">LEAD_EMPTY: [No matching records]</td></tr>
                                    ) : (
                                        bookings.map((booking) => (
                                            <tr key={booking._id} className="hover:bg-slate-50/80 transition-all duration-200 group">
                                                <td className="px-8 py-6">
                                                    <div className="text-sm font-black text-slate-900 mb-2 leading-none">#{booking.bookingId}</div>
                                                    <div className="flex flex-col space-y-1.5 font-medium">
                                                        <div className="flex items-center text-xs text-slate-500">
                                                            <User size={10} className="mr-2 text-slate-300" /> {booking.customer?.name}
                                                        </div>
                                                        <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                            <Clock size={10} className="mr-2 text-slate-300" /> {new Date(booking.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 min-w-[300px]">
                                                    <div className="flex items-start space-x-4">
                                                        <div className="flex flex-col items-center mt-1 space-y-1">
                                                            <div className="h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-indigo-100 shadow-[0_0_8px_rgba(79,70,229,0.3)]" />
                                                            <div className="w-[1px] h-6 border-l border-dashed border-slate-300" />
                                                            <div className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-rose-100 shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                                                        </div>
                                                        <div className="text-xs space-y-3.5 flex-1 mt-0.5">
                                                            <p className="text-slate-900 font-black truncate max-w-[200px] leading-none mb-1">{booking.pickup.address}</p>
                                                            <p className="text-slate-400 font-bold truncate max-w-[200px] leading-none">{booking.drop.address}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`status-badge ${statusConfig[booking.status]?.color || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                                        <div className={`h-1.5 w-1.5 rounded-full mr-2 ${statusConfig[booking.status]?.iconColor || 'bg-slate-400'}`}></div>
                                                        {statusConfig[booking.status]?.label?.toUpperCase() || booking.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-sm font-black text-slate-900 mb-1 leading-none">₹{booking.fare.total}</div>
                                                    <div className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{booking.vehicleType}</div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button className="h-10 w-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50 transition-all transition-all duration-300 active:scale-90">
                                                        <ExternalLink size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Premium Pagination */}
                        <div className="px-8 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                Showing
                                <span className="text-slate-900 mx-2 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                                    {(page - 1) * 10 + 1} - {Math.min(page * 10, pagination.total)}
                                </span>
                                of {pagination.total} orders
                            </div>

                            <div className="flex items-center space-x-4">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="h-10 w-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-30 disabled:hover:bg-white transition-all duration-200 active:scale-90"
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                <div className="flex space-x-1.5">
                                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i + 1)}
                                            className={`h-10 w-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-200 ${page === i + 1 ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-100'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    disabled={page === pagination.pages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="h-10 w-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-30 disabled:hover:bg-white transition-all duration-200 active:scale-90"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Analytics Insight Component */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-[2rem] bg-indigo-600 text-white relative overflow-hidden group">
                    <div className="absolute right-0 bottom-0 h-24 w-24 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Platform Efficiency</p>
                    <h4 className="text-2xl font-black mb-4 tracking-tight">Average Response: 2.4m</h4>
                    <div className="h-1.5 w-full bg-indigo-500 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-[88%] rounded-full shadow-[0_0_10px_white]"></div>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-[2rem] border-amber-100 flex items-center">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mr-4">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attention Required</p>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">3 Flagged Orders</h4>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-[2rem] border-emerald-100 flex items-center">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mr-4">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fulfilled Today</p>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">{pagination.total || 0} Successful</h4>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bookings;
