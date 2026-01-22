import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Map as MapIcon,
    Users,
    Calendar,
    Settings,
    LogOut,
    Truck,
    ShieldCheck,
    CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: MapIcon, label: 'Live Fleet', path: '/map' },
        { icon: Truck, label: 'Drivers', path: '/drivers' },
        { icon: Calendar, label: 'Bookings', path: '/bookings' },
        { icon: Users, label: 'Customers', path: '/customers' },
        { icon: CreditCard, label: 'Payments', path: '/payments' },
        { icon: ShieldCheck, label: 'Security', path: '/security' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r border-slate-200/60 bg-white group transition-all duration-300">
            <div className="flex h-full flex-col px-4 py-8">
                {/* Logo Area */}
                <div className="flex items-center mb-10 px-4">
                    <div className="h-11 w-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 mr-4">
                        <Truck className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">PORTER</h1>
                        <p className="text-[10px] font-bold text-indigo-500 tracking-[0.2em] uppercase -mt-1">Admin Portal</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
                    <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center rounded-2xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 group relative ${isActive
                                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    <span className="ml-4">{item.label}</span>
                                    {isActive && (
                                        <div className="absolute left-0 w-1.5 h-6 bg-indigo-600 rounded-r-full shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="mt-8 pt-6 border-t border-slate-100 px-2">
                    <button
                        onClick={logout}
                        className="flex w-full items-center rounded-2xl p-4 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all active:scale-95 group"
                    >
                        <div className="h-8 w-8 rounded-xl bg-rose-100 flex items-center justify-center mr-4 group-hover:bg-rose-200 transition-colors">
                            <LogOut className="h-4 w-4" />
                        </div>
                        <span>Sign Out</span>
                    </button>

                    <div className="mt-8 px-4 py-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 h-24 w-24 bg-indigo-500/20 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-2">Support</p>
                        <p className="text-xs font-medium text-slate-300 mb-4 leading-relaxed">Need help with the platform management?</p>
                        <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                            Get Help
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
