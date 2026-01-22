import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    User,
    Shield,
    Bell,
    Globe,
    Database,
    Save,
    CheckCircle,
    AlertTriangle,
    ChevronRight,
    Monitor,
    CloudLightning,
    Smartphone
} from 'lucide-react';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const tabs = [
        { id: 'profile', label: 'User Profile', icon: User },
        { id: 'security', label: 'Security Protocols', icon: Shield },
        { id: 'notifications', label: 'System Alerts', icon: Bell },
        { id: 'general', label: 'General Config', icon: Globe },
        { id: 'infrastructure', label: 'Infrastructure', icon: Database },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
                    <p className="text-slate-500 font-medium">Platform orchestration and administrative preferences.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="btn-primary h-12 bg-indigo-600 shadow-xl shadow-indigo-100 border-none group px-8"
                >
                    {saved ? (
                        <span className="flex items-center"><CheckCircle className="mr-2 h-4 w-4" /> Changes Applied</span>
                    ) : (
                        <span className="flex items-center"><Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" /> Deploy Updates</span>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Sidebar Nav */}
                <div className="lg:col-span-3 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === tab.id
                                ? 'bg-white shadow-xl shadow-indigo-50/50 text-indigo-600 border border-indigo-50'
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-900 border border-transparent'}`}
                        >
                            <div className="flex items-center">
                                <tab.icon className={`h-5 w-5 mr-3 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className="text-sm font-black tracking-tight">{tab.label}</span>
                            </div>
                            <ChevronRight className={`h-4 w-4 transition-transform ${activeTab === tab.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
                        </button>
                    ))}

                    <div className="mt-10 p-6 bg-rose-50 rounded-[2rem] border border-rose-100">
                        <div className="flex items-center text-rose-600 mb-3">
                            <AlertTriangle size={18} className="mr-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Maintenance Mode</span>
                        </div>
                        <p className="text-xs font-bold text-rose-900/60 leading-relaxed mb-4">Taking the platform offline will affect all users and drivers globally.</p>
                        <button className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors shadow-lg shadow-rose-100">
                            Activate Lockdown
                        </button>
                    </div>
                </div>

                {/* Dynamic Content Area */}
                <div className="lg:col-span-9 space-y-8">
                    <div className="glass-card rounded-[2.5rem] p-10 border border-white">
                        {activeTab === 'profile' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h3 className="text-xl font-black text-slate-900 mb-8 border-b border-slate-50 pb-6 uppercase tracking-widest text-[10px]">Administrative Identity</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Name</label>
                                        <input type="text" defaultValue={user?.name || 'Super Admin'} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none ring-4 ring-indigo-50/0 focus:ring-indigo-50 transition-all border-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Phone Number</label>
                                        <input type="text" defaultValue={user?.phone || '+91 9999999999'} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none border-none" />
                                    </div>
                                    <div className="space-y-2 lg:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Email</label>
                                        <input type="email" defaultValue={user?.email || 'admin@porter.com'} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none border-none" />
                                    </div>
                                </div>

                                <div className="mt-12 flex items-center p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <div className="h-20 w-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 mr-6">
                                        Avatar
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">Portrait Image</p>
                                        <p className="text-xs font-bold text-slate-400 mt-1 mb-3">Min size 400x400px • PNG, JPG</p>
                                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Upload New Identity</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <h3 className="text-xl font-black text-slate-900 mb-8 border-b border-slate-50 pb-6 uppercase tracking-widest text-[10px]">Engagement Protocols</h3>
                                <div className="space-y-6">
                                    {[
                                        { id: 'not_1', label: 'Push Notifications', desc: 'Direct broadcast to browser agent.', icon: Monitor },
                                        { id: 'not_2', label: 'SMS Gateway', desc: 'Critical alert path via Twilio.', icon: Smartphone },
                                        { id: 'not_3', label: 'Cloud Execution Alerts', desc: 'Notify on script failures or load spikes.', icon: CloudLightning },
                                    ].map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-indigo-100 transition-all">
                                            <div className="flex items-center">
                                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 mr-5 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                                    <item.icon size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{item.label}</p>
                                                    <p className="text-xs font-bold text-slate-400 mt-0.5">{item.desc}</p>
                                                </div>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab !== 'profile' && activeTab !== 'notifications' && (
                            <div className="h-96 flex flex-col items-center justify-center text-center opacity-30 select-none animate-in fade-in duration-500">
                                <Shield size={64} className="text-slate-200 mb-6" />
                                <p className="text-xl font-black uppercase tracking-widest">Protocol Encrypted</p>
                                <p className="text-xs font-bold mt-2">Section v1.2 remains under development</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-8 rounded-[2rem] border border-white">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Platform Version</p>
                            <div className="flex items-center justify-between">
                                <h4 className="text-2xl font-black text-slate-900">v1.2.0-STABLE</h4>
                                <span className="px-3 py-1 bg-indigo-50 text-[10px] font-black text-indigo-600 rounded-lg">LATEST</span>
                            </div>
                        </div>
                        <div className="glass-card p-8 rounded-[2rem] border border-white flex items-center justify-between group cursor-pointer hover:border-indigo-100 transition-all">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Backup status</p>
                                <h4 className="text-xl font-black text-slate-900 leading-none">32 Minutes Ago</h4>
                            </div>
                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                <Save size={18} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
