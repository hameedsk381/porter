import { useState } from 'react';
import {
    ShieldCheck,
    Lock,
    Key,
    Eye,
    Globe,
    UserPlus,
    UserMinus,
    AlertCircle,
    Terminal,
    Zap
} from 'lucide-react';

const Security = () => {
    const [activeLayer, setActiveLayer] = useState('audit');

    const logs = [
        { id: 'log_1', action: 'ADMIN_LOGIN', user: 'admin@porter.com', ip: '192.168.1.1', time: '2m ago', status: 'success' },
        { id: 'log_2', action: 'KYC_APPROVAL', user: 'admin@porter.com', ip: '192.168.1.1', time: '14m ago', status: 'success' },
        { id: 'log_3', action: 'SUSPICIOUS_LOGIN', user: 'unknown@intel.com', ip: '45.12.98.3', time: '1h ago', status: 'blocked' },
        { id: 'log_4', action: 'DB_BACKUP_INIT', user: 'SYSTEM', ip: 'internal', time: '4h ago', status: 'success' },
        { id: 'log_5', action: 'API_KEY_ROTATION', user: 'admin@porter.com', ip: '10.0.0.4', time: 'Yesterday', status: 'success' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Encryption Hub</h1>
                    <p className="text-slate-500 font-medium">Monitoring administrative access and protocol integrity.</p>
                </div>
                <div className="flex bg-slate-900/5 p-1 rounded-2xl border border-slate-200">
                    <button
                        onClick={() => setActiveLayer('audit')}
                        className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeLayer === 'audit' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Audit Log
                    </button>
                    <button
                        onClick={() => setActiveLayer('roles')}
                        className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeLayer === 'roles' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Permission Matrix
                    </button>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-8 rounded-[2.5rem] bg-indigo-600 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-3">Threat protection</p>
                    <h4 className="text-3xl font-black mb-1 tracking-tighter">Active</h4>
                    <div className="flex items-center text-xs font-bold text-indigo-200 mt-4">
                        <Zap size={14} className="mr-2" /> 99.9% Traffic Filtered
                    </div>
                </div>
                <div className="glass-card p-8 rounded-[2.5rem] border border-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Active Session Cells</p>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">14 Admins</h4>
                    <div className="flex items-center text-xs font-bold text-emerald-500 mt-4 uppercase tracking-widest">
                        <Globe size={14} className="mr-2" /> Global Availability
                    </div>
                </div>
                <div className="glass-card p-8 rounded-[2.5rem] border border-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Compliance Score</p>
                    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">A+ 100/100</h4>
                    <div className="flex items-center text-xs font-bold text-slate-400 mt-4">
                        <Lock size={14} className="mr-2" /> SOC2 v2 Certified
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Side: Detail or Form */}
                <div className="lg:col-span-8 space-y-8">
                    {activeLayer === 'audit' ? (
                        <div className="glass-card rounded-[2.5rem] p-10 bg-slate-900 text-white relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div className="flex items-center">
                                    <Terminal className="text-indigo-400 mr-3 h-5 w-5" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Live Security Event Stream</h3>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 group-hover:border-white/10 transition-all hover:bg-white/10">
                                        <div className="flex items-center">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mr-5 ${log.status === 'blocked' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                                {log.status === 'blocked' ? <ShieldCheck size={18} /> : <Eye size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black tracking-tight">{log.action}</p>
                                                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{log.user} • {log.ip}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-300">{log.time}</p>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg mt-1 inline-block ${log.status === 'blocked' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                {log.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-colors">
                                Access Historical Archives
                            </button>
                        </div>
                    ) : (
                        <div className="glass-card rounded-[2.5rem] p-10 border border-white bg-white">
                            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Permission Matrix</h3>
                                    <p className="text-sm text-slate-400 font-medium mt-1 italic">Defining structural hierarchical access controls.</p>
                                </div>
                                <button className="h-10 px-5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center">
                                    <UserPlus size={14} className="mr-2" /> Add Level
                                </button>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { role: 'Super Admin', access: 'Root / Full Access', count: 2, color: 'text-indigo-600' },
                                    { role: 'Operations', access: 'Drivers / KYC / Bookings', count: 8, color: 'text-emerald-600' },
                                    { role: 'Support Agent', access: 'Bookings (Read) / Customers', count: 14, color: 'text-blue-600' },
                                ].map((row, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group hover:shadow-lg hover:shadow-indigo-50 transition-all border border-transparent hover:border-indigo-100">
                                        <div className="flex items-center">
                                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 mr-5 group-hover:text-indigo-600 transition-colors shadow-sm">
                                                <ShieldCheck size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{row.role}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{row.access}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-6">
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-900">{row.count}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Seats</p>
                                            </div>
                                            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all">
                                                <UserMinus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Quick Tools */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass-card rounded-[2.5rem] p-8 border border-white">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center">
                            <Key size={16} className="text-indigo-600 mr-2" /> Encryption Keys
                        </h3>
                        {[
                            { label: 'Public Tunnel (PKI)', status: 'Rotated 2d ago', val: 'RSA-4096' },
                            { label: 'DB Master Key', status: 'Secured in Vault', val: 'AES-256' },
                            { label: 'Twilio Gateway', status: 'Active Token', val: 'v2.1' },
                        ].map((key, i) => (
                            <div key={i} className="mb-6 last:mb-0">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    <span>{key.label}</span>
                                    <span className="text-emerald-500">{key.val}</span>
                                </div>
                                <div className="h-10 bg-slate-50 border border-slate-100 rounded-xl px-4 flex items-center justify-between group cursor-pointer hover:border-indigo-100 transition-all">
                                    <span className="text-xs font-mono font-bold text-slate-900/50">••••••••••••••••</span>
                                    <button className="text-[10px] font-black text-slate-300 group-hover:text-indigo-600 uppercase tracking-widest transition-colors">Rotate</button>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 mt-2 italic px-1">{key.status}</p>
                            </div>
                        ))}
                    </div>

                    <div className="glass-card p-8 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-rose-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="flex items-center space-x-3 mb-4">
                            <AlertCircle className="text-rose-500" size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Critical Zone</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-300 leading-relaxed mb-6">Initiate global session wipe? All logged in agents will be disconnected.</h4>
                        <button className="w-full py-4 bg-rose-600/10 border border-rose-500/20 rounded-2xl text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
                            Kill All Sessions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Security;
