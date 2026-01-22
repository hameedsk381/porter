import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import {
    DollarSign,
    CreditCard,
    TrendingUp,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Download,
    Search,
    PieChart as PieChartIcon,
    Activity,
    ExternalLink
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const Payments = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true);
                const res = await adminAPI.getPayments({});
                setData(res.data.data);
            } catch (err: any) {
                console.error('Payment fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
        </div>
    );

    const { stats, paymentMethods, recentPayments } = data;

    const cards = [
        { label: 'Gross Volume', value: `₹${stats.totalAmount.toLocaleString()}`, icon: DollarSign, color: 'bg-indigo-500' },
        { label: 'Platform Revenue', value: `₹${stats.platformCommission.toLocaleString()}`, icon: Activity, color: 'bg-emerald-500' },
        { label: 'Driver Payouts', value: `₹${stats.driverPayout.toLocaleString()}`, icon: TrendingUp, color: 'bg-blue-500' },
        { label: 'Transactions', value: stats.totalTransactions.toString(), icon: CreditCard, color: 'bg-violet-500' },
    ];

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial Ledger</h1>
                    <p className="text-slate-500 font-medium">Platform revenue and transaction analytics.</p>
                </div>
                <button className="btn-primary bg-slate-900 h-12 shadow-xl shadow-slate-200 border-none group">
                    <Download className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                    Download Statement
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card, idx) => (
                    <div key={idx} className="glass-card p-8 rounded-[2.5rem] relative group overflow-hidden">
                        <div className={`absolute -right-4 -bottom-4 h-24 w-24 ${card.color} opacity-5 rounded-full scale-110 group-hover:scale-150 transition-transform duration-700`}></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={`h-12 w-12 rounded-2xl ${card.color} bg-opacity-10 flex items-center justify-center text-white ring-1 ring-inset ring-white/10`}>
                                <card.icon className={`h-6 w-6 ${card.color === 'bg-indigo-500' ? 'text-indigo-600' : card.color === 'bg-emerald-500' ? 'text-emerald-600' : card.color === 'bg-blue-500' ? 'text-blue-600' : 'text-violet-600'}`} />
                            </div>
                            <ArrowUpRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" size={20} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{card.label}</p>
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{card.value}</h4>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Method Mix */}
                <div className="lg:col-span-5 glass-card rounded-[2.5rem] p-8 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900">Payment Gateway Mix</h3>
                        <PieChartIcon className="text-slate-300 h-5 w-5" />
                    </div>
                    <div className="flex-1 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={10}
                                    dataKey="total"
                                    nameKey="_id"
                                    cornerRadius={10}
                                >
                                    {paymentMethods.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '20px',
                                        border: 'none',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                        fontWeight: '800'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 space-y-4">
                        {paymentMethods.map((method: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="h-3 w-3 rounded-full mr-3" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{method._id}</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">₹{method.total.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="lg:col-span-7 glass-card rounded-[2.5rem] p-8">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Volume distribution</h3>
                            <p className="text-sm text-slate-400 font-medium">Economics overview across filters</p>
                        </div>
                        <div className="bg-slate-100 p-1 rounded-2xl flex">
                            <button className="px-5 py-2 bg-white text-xs font-black text-indigo-600 rounded-xl shadow-sm">Revenue</button>
                            <button className="px-5 py-2 text-xs font-bold text-slate-500">Transactions</button>
                        </div>
                    </div>
                    <div className="h-[380px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={paymentMethods}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="total" radius={[12, 12, 0, 0]}>
                                    {paymentMethods.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Transaction Table */}
            <div className="glass-card rounded-[2.5rem] p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-10 px-2">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Transaction Log</h3>
                        <p className="text-sm text-slate-400 font-medium italic mt-1">Live monitoring of platform clearing house.</p>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input type="text" placeholder="TX_ID, Reference..." className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white outline-none w-64 shadow-inner" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Customer Entity</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Reference ID</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Settlement Date</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Economics</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {recentPayments.length === 0 ? (
                                <tr><td colSpan={6} className="px-8 py-20 text-center font-black text-slate-300">VOID_ARCHIVE: [No transactions recorded]</td></tr>
                            ) : (
                                recentPayments.map((payment: any) => (
                                    <tr key={payment._id} className="hover:bg-indigo-50/30 transition-all duration-300 group">
                                        <td className="px-8 py-6">
                                            <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black border border-emerald-100/50 uppercase">
                                                SUCCESS
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold text-xs mr-4 transition-transform group-hover:scale-110">
                                                    {payment.customer?.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{payment.customer?.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">{payment.customer?.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-black text-slate-900 font-mono tracking-tighter">#{payment.booking?.bookingId || 'FL_41209'}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">{payment.reference || 'SYSTEM_GEN'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-black text-slate-900 leading-none mb-1 opacity-80">{new Date(payment.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            <p className="text-[10px] text-indigo-500 font-black tracking-widest">{new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                        <td className="px-8 py-6 text-indigo-600 font-black text-base italic tracking-tighter">
                                            ₹{payment.amount.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="h-10 w-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-xl transition-all active:scale-90">
                                                <ExternalLink size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-8 flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform Clearing Agent Status: <span className="text-emerald-500">Live</span></p>
                    <div className="flex items-center space-x-2">
                        <button className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-400 opacity-30 cursor-not-allowed transition-all"><ChevronLeft size={16} /></button>
                        <div className="h-10 px-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xs font-black scale-95 shadow-lg shadow-indigo-100 ring-2 ring-indigo-50">01</div>
                        <button className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payments;
