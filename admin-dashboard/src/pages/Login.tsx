import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, ArrowRight, Loader2, ShieldCheck, Mail, Lock } from 'lucide-react';

const Login = () => {
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('+91');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { sendOTP, login } = useAuth();
    const navigate = useNavigate();

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await sendOTP(phone);
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to initialize session');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(phone, otp);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>

            <div className="max-w-5xl w-full grid lg:grid-cols-2 bg-white rounded-[3rem] shadow-2xl shadow-indigo-100 overflow-hidden relative z-10 border border-slate-100">

                {/* Left Side: Illustration / Info */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent"></div>

                    <div className="relative z-10">
                        <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-900/50 mb-8 mt-2">
                            <Truck className="h-7 w-7" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight leading-tight">
                            Manage the world's <br />
                            <span className="text-indigo-400">logistics fleet.</span>
                        </h1>
                        <p className="mt-6 text-slate-400 font-medium text-lg leading-relaxed max-w-sm">
                            Secure admin portal for real-time fleet intelligence, partner compliance, and order management.
                        </p>
                    </div>

                    <div className="relative z-10 space-y-6 mb-4">
                        <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Encrypted Tunnel</p>
                                <p className="text-xs text-slate-500">AES-256 standard security</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                            System Status: <span className="text-emerald-500">Operational</span>
                        </p>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="p-8 lg:p-16 flex flex-col justify-center">
                    <div className="mb-10 lg:hidden flex justify-center">
                        <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                            <Truck size={24} />
                        </div>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                            {step === 'phone' ? 'Admin Access' : 'Verification'}
                        </h2>
                        <p className="text-slate-500 font-medium">
                            {step === 'phone'
                                ? 'Authorized personnel only. Please sign in.'
                                : `We've sent a code to ${phone}`}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mr-3 shrink-0">
                                <Lock size={14} />
                            </div>
                            <span className="text-sm font-bold text-rose-900 leading-tight">{error}</span>
                        </div>
                    )}

                    <form onSubmit={step === 'phone' ? handleSendOTP : handleLogin} className="space-y-6">
                        {step === 'phone' ? (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Phone ID</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="+91 00000 00000"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center justify-center group active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin h-5 w-5" />
                                    ) : (
                                        <>
                                            Initialize Access <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Identity Code</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full py-5 bg-slate-50 border border-slate-100 rounded-2xl text-3xl font-black tracking-[0.5em] text-center focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all placeholder:text-slate-100 text-indigo-600"
                                    />
                                    <div className="flex justify-center text-[10px] font-bold">
                                        <button type="button" onClick={() => setStep('phone')} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                            Wrong number? Change Identity
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-100 transition-all flex items-center justify-center active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin h-5 w-5" />
                                    ) : (
                                        'Verify Credentials'
                                    )}
                                </button>
                            </div>
                        )}
                    </form>

                    <div className="mt-12 pt-8 border-t border-slate-50">
                        <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] leading-relaxed">
                            © 2026 Porter Security Protocol • v1.2.0 <br />
                            Unauthorized access is strictly prohibited.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
