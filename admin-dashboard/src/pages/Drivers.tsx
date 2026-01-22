import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import {
    Search,
    Filter,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    Clock,
    Truck,
    Download,
    Plus,
    ShieldCheck,
    Phone,
    Star
} from 'lucide-react';

const Drivers = () => {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getDrivers({ search });
            setDrivers(response.data.data.drivers);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            if (!window.confirm('Confirm KYC approval for this driver?')) return;
            await adminAPI.approveDriver(id);
            fetchDrivers();
        } catch (err: any) {
            alert('Approval failed: ' + err.message);
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt('Provide rejection reason:');
        if (reason === null) return;
        try {
            await adminAPI.rejectDriver(id, reason);
            fetchDrivers();
        } catch (err: any) {
            alert('Rejection failed: ' + err.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Management</h1>
                    <p className="text-slate-500 font-medium">Verified partners and operational drivers.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="btn-secondary h-12 px-5">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </button>
                    <button className="btn-primary h-12 px-6 bg-slate-900 shadow-xl shadow-slate-100 border-none hover:bg-slate-800">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Partner
                    </button>
                </div>
            </div>

            {/* Control Bar */}
            <div className="glass-card p-6 rounded-[2rem] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search driver name, phone, or vehicle ID..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchDrivers()}
                        />
                    </div>
                    <button className="btn-secondary h-[46px] rounded-2xl">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </button>
                </div>

                <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    <button className="px-6 py-2 bg-white text-xs font-black text-indigo-600 rounded-xl shadow-sm border border-indigo-50">All Drivers</button>
                    <button className="px-6 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">Verified Only</button>
                    <button className="px-6 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">Pending KYC</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="glass-card rounded-[2.5rem] overflow-hidden">
                {loading ? (
                    <div className="h-96 flex flex-col items-center justify-center space-y-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
                        <p className="text-sm font-bold text-slate-400 animate-pulse">Scanning Fleet Database...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 text-center">
                        <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} />
                        </div>
                        <p className="text-xl font-black text-slate-900">Search Failed</p>
                        <p className="text-slate-500 mt-2">{error}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Partner Identity</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Vehicle Assets</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Compliance</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Presence</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Performance</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {drivers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <p className="text-lg font-black text-slate-300">No matching partners found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    drivers.map((driver) => (
                                        <tr key={driver._id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center">
                                                    <div className="relative group-hover:scale-110 transition-transform duration-300">
                                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black text-lg shadow-sm border border-white">
                                                            {driver.name.charAt(0)}
                                                        </div>
                                                        {driver.driverProfile?.isAvailable && (
                                                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white ring-2 ring-emerald-50 scale-100 animate-pulse"></div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <p className="text-sm font-black text-slate-900 leading-tight mb-1">{driver.name}</p>
                                                        <div className="flex items-center text-[10px] font-bold text-slate-400">
                                                            <Phone size={10} className="mr-1" /> {driver.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-2">
                                                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/50">
                                                        <Truck size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 capitalize leading-none mb-1">
                                                            {driver.driverProfile?.vehicleType?.replace('-', ' ') || 'N/A'}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            {driver.driverProfile?.vehicleNumber || 'Unassigned'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {driver.driverProfile?.isKYCVerified ? (
                                                    <span className="status-badge bg-emerald-50 text-emerald-600 border-emerald-100">
                                                        <ShieldCheck size={10} className="mr-1.5" /> VERIFIED
                                                    </span>
                                                ) : (
                                                    <span className="status-badge bg-amber-50 text-amber-600 border-amber-100">
                                                        <Clock size={10} className="mr-1.5" /> PENDING
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${driver.driverProfile?.isAvailable ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {driver.driverProfile?.isAvailable ? 'Active Now' : 'Standby'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center">
                                                    <Star size={12} className="text-amber-400 fill-amber-400 mr-1.5" />
                                                    <span className="text-sm font-black text-slate-900">{driver.driverProfile?.rating?.average?.toFixed(1) || '0.0'}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 ml-2">({driver.driverProfile?.rating?.count || 0})</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end items-center space-x-2">
                                                    {!driver.driverProfile?.isKYCVerified && (
                                                        <div className="flex mr-2 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleApprove(driver._id)}
                                                                className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-sm"
                                                                title="Approve KYC"
                                                            >
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(driver._id)}
                                                                className="h-9 w-9 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center justify-center hover:bg-rose-100 transition-colors shadow-sm"
                                                                title="Reject Partner"
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button className="h-9 w-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
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

                <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total Fleet: <span className="text-slate-900 ml-1">{drivers.length} Partners</span>
                    </p>
                    <div className="flex space-x-2">
                        <button className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 opacity-50"><MoreHorizontal size={14} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Drivers;
