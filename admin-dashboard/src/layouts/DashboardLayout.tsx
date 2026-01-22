import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50/50 flex">
            {/* Sidebar stays fixed */}
            <Sidebar />

            {/* Main content area */}
            <div className="flex-1 ml-72 flex flex-col min-h-screen">
                <Header />

                <main className="p-8 lg:p-10 max-w-[1600px] w-full mx-auto">
                    <Outlet />
                </main>

                {/* Footer simple */}
                <footer className="py-6 px-10 border-t border-slate-100 text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-auto">
                    © 2026 Porter Logistics Platform • Internal Admin Console v1.2.0
                </footer>
            </div>
        </div>
    );
};

export default DashboardLayout;
