import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import {
    Search,
    Filter,
    MoreHorizontal,
    User as UserIcon,
    Phone,
    Calendar,
    Mail,
    ShieldAlert,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    UserX,
    UserCheck
} from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, [page]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getUsers({ page, role: 'customer', search });
            setCustomers(res.data.data.users);
            setPagination(res.data.data.pagination);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;
            await adminAPI.updateUserStatus(id, !currentStatus);
            fetchCustomers();
        } catch (err: any) {
            alert('Update failed: ' + err.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Base</h1>
                    <p className="text-slate-500 font-medium">Managing logistics consumers and enterprise accounts.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">U{i}</div>
                        ))}
                        <div className="h-10 w-10 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">+2k</div>
                    </div>
                </div>
            </div>

            {/* Control Strip */}
            <div className="glass-card p-6 rounded-[2rem] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, phone or email identifier..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
                        />
                    </div>
                    <button className="btn-secondary h-[46px] rounded-2xl px-5">
                        <Filter className="h-4 w-4 mr-2" />
                        Sort
                    </button>
                </div>
                <div className="flex items-center bg-indigo-50/50 p-1 rounded-2xl border border-indigo-100/30">
                    <button className="px-6 py-2 bg-white text-xs font-black text-indigo-600 rounded-xl shadow-sm border border-indigo-100/50">Customers</button>
                    <button className="px-6 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">Admins</button>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white">
                {loading ? (
                    <div className="h-96 flex flex-col items-center justify-center space-y-4">
                        <div className="h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Compiling User Data...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 text-center">
                        <ShieldAlert className="mx-auto h-12 w-12 text-rose-500 mb-4 opacity-20" />
                        <p className="text-lg font-black text-slate-900">Archive Access Failed</p>
                        <p className="text-sm text-slate-400 mt-1">{error}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Customer Identity</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Contact Metrics</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Account State</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Joined On</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {customers.length === 0 ? (
                                    <tr><td colSpan={5} className="px-8 py-20 text-center font-black text-slate-300 text-lg">LEAD_EMPTY: [No matching consumers]</td></tr>
                                ) : (
                                    customers.map((user) => (
                                        <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center">
                                                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-slate-100 to-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm transition-transform group-hover:scale-110">
                                                        <UserIcon size={20} />
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-black text-slate-900 leading-none mb-1.5">{user.name}</p>
                                                        <div className="flex items-center text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                                                            ID: {user._id.slice(-6)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center text-xs font-bold text-slate-700">
                                                        <Phone size={12} className="mr-2 text-slate-300" /> {user.phone}
                                                    </div>
                                                    <div className="flex items-center text-xs font-bold text-slate-400">
                                                        <Mail size={12} className="mr-2 text-slate-300" /> {user.email || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`status-badge ${user.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {user.isActive ? <ShieldCheck size={10} className="mr-1.5" /> : <ShieldAlert size={10} className="mr-1.5" />}
                                                    {user.isActive ? 'ACTIVE_SECURE' : 'SUSPENDED'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center text-xs font-black text-slate-900 opacity-80">
                                                    <Calendar size={12} className="mr-2 text-slate-300" />
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => toggleStatus(user._id, user.isActive)}
                                                        className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${user.isActive ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'}`}
                                                        title={user.isActive ? 'Deactivate User' : 'Activate User'}
                                                    >
                                                        {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                                                    </button>
                                                    <button className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all opacity-0 group-hover:opacity-100">
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Improved Pagination */}
                <div className="px-8 py-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Population: <span className="text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 ml-2 shadow-sm">{pagination.total || 0} Entities</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="h-10 w-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="h-10 px-6 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 border border-slate-800">
                            Index {page} / {pagination.pages || 1}
                        </div>
                        <button
                            disabled={page === pagination.pages}
                            onClick={() => setPage(p => p + 1)}
                            className="h-10 w-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-30 transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Customers;
