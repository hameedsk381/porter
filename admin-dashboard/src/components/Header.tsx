import { Bell, Search, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-8 transition-all duration-300">
            <div className="flex items-center flex-1 max-w-xl">
                <div className="relative w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search for bookings, drivers or users..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500/30 outline-none transition-all duration-200"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                    <button className="relative p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-500/20 group-hover:animate-ping"></span>
                    </button>

                    <button className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Settings className="h-5 w-5" />
                    </button>
                </div>

                <div className="h-8 w-[1px] bg-slate-200"></div>

                <div className="flex items-center space-x-3 cursor-pointer group">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-800 leading-none mb-1 group-hover:text-indigo-600 transition-colors">{user?.name || 'Super Admin'}</p>
                        <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">{user?.role || 'Admin'}</p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-200 ring-2 ring-white transition-transform group-hover:scale-110">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
