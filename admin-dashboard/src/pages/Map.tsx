import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../services/socket';
import { adminAPI } from '../services/api';
import {
    Navigation,
    Clock,
    Info,
    Activity,
    Maximize,
    RefreshCw,
    Search,
    Filter,
    Layout
} from 'lucide-react';

// Custom driver icons using divIcon for better styling
const createDriverIcon = (status: string, heading: number = 0) => {
    const color = status === 'available' ? '#10b981' : '#6366f1';
    return L.divIcon({
        className: 'custom-driver-icon',
        html: `
      <div class="relative flex items-center justify-center group">
        <div class="absolute inset-0 h-8 w-8 bg-${status === 'available' ? 'emerald' : 'indigo'}-500 opacity-20 rounded-full animate-ping"></div>
        <div class="relative h-10 w-10 bg-white shadow-xl rounded-2xl flex items-center justify-center border-2 border-${status === 'available' ? 'emerald' : 'indigo'}-500/20" style="transform: rotate(${heading}deg)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 2 10 18-10-4-10 4Z"/>
          </svg>
        </div>
      </div>
    `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
};

const LocationMarker = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom(), { duration: 1.5 });
    }, [center]);
    return null;
};

const Map = () => {
    const [drivers, setDrivers] = useState<Record<string, any>>({});
    const { socket, isConnected } = useSocket();
    const [center, setCenter] = useState<[number, number]>([19.0760, 72.8777]);
    const [stats, setStats] = useState({ online: 0, busy: 0 });

    useEffect(() => {
        const loadDrivers = async () => {
            try {
                const res = await adminAPI.getDrivers({ availability: 'online' });
                const onlineDrivers = res.data.data.drivers;
                const driverMap: Record<string, any> = {};
                onlineDrivers.forEach((d: any) => {
                    if (d.driverProfile?.currentLocation?.coordinates) {
                        driverMap[d._id] = {
                            id: d._id,
                            name: d.name,
                            location: {
                                latitude: d.driverProfile.currentLocation.coordinates[1],
                                longitude: d.driverProfile.currentLocation.coordinates[0]
                            },
                            status: d.driverProfile.isAvailable ? 'available' : 'on_trip',
                            vehicle: d.driverProfile.vehicleType,
                            heading: 0
                        };
                    }
                });
                setDrivers(driverMap);
            } catch (err) {
                console.error('Failed to load initial drivers', err);
            }
        };
        loadDrivers();
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on('admin:driver_location', (data: any) => {
            setDrivers(prev => ({
                ...prev,
                [data.driverId]: {
                    ...prev[data.driverId],
                    location: data.location,
                    status: data.status,
                    heading: data.heading || 0,
                    lastUpdate: data.timestamp
                }
            }));
        });
        return () => { socket.off('admin:driver_location'); };
    }, [socket]);

    useEffect(() => {
        const driverList = Object.values(drivers);
        setStats({
            online: driverList.filter(d => d.status === 'available').length,
            busy: driverList.filter(d => d.status === 'on_trip').length
        });
    }, [drivers]);

    return (
        <div className="space-y-6 animate-in fade-in duration-700 h-[calc(100vh-8rem)] flex flex-col">
            {/* Map Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Fleet Intel</h1>
                    <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                            {stats.online} Available
                        </div>
                        <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-indigo-600">
                            <div className="h-2 w-2 rounded-full bg-indigo-500 mr-2"></div>
                            {stats.busy} On Trip
                        </div>
                        <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${isConnected ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'}`}>
                            {isConnected ? 'Stream: Connected' : 'Stream: Lost'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="relative group w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-3 w-3" />
                        <input type="text" placeholder="Jump to Driver ID..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:ring-4 focus:ring-indigo-50 outline-none" />
                    </div>
                    <button className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all shadow-sm">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Main Map Core */}
            <div className="flex-1 relative rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
                <MapContainer
                    center={center}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {Object.values(drivers).map((driver) => (
                        <Marker
                            key={driver.id}
                            position={[driver.location.latitude, driver.location.longitude]}
                            icon={createDriverIcon(driver.status, driver.heading)}
                        >
                            <Popup className="premium-popup">
                                <div className="p-4 min-w-[200px] bg-white rounded-2xl">
                                    <div className="flex items-center border-b border-slate-100 pb-3 mb-3">
                                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-black text-xs mr-3 border border-indigo-100">
                                            {driver.name?.charAt(0) || 'D'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 leading-tight mb-0.5">{driver.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{driver.vehicle?.replace('-', ' ')}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-bold">
                                            <span className="text-slate-400 flex items-center"><Navigation size={10} className="mr-1.5" /> STATE</span>
                                            <span className={`px-2 py-0.5 rounded-md ${driver.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {driver.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                            <span className="flex items-center"><Clock size={10} className="mr-1.5" /> UPDATED</span>
                                            <span>{driver.lastUpdate ? new Date(driver.lastUpdate).toLocaleTimeString() : 'LIVE'}</span>
                                        </div>
                                    </div>
                                    <button className="w-full mt-4 py-2.5 bg-slate-900 text-[10px] font-black text-white rounded-xl hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                                        INITIATE CALL
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    <LocationMarker center={center} />
                </MapContainer>

                {/* Map Overlays */}
                <div className="absolute top-6 left-6 z-[1000] flex flex-col space-y-3">
                    <button className="h-12 w-12 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all border border-white">
                        <Layout size={20} />
                    </button>
                    <button className="h-12 w-12 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-all border border-white">
                        <Activity size={20} />
                    </button>
                </div>

                <div className="absolute bottom-6 right-6 z-[1000] flex flex-col space-y-3">
                    <button className="h-14 w-14 bg-indigo-600 rounded-[1.5rem] shadow-2xl shadow-indigo-200 flex items-center justify-center text-white hover:bg-indigo-700 transition-all active:scale-90 ring-4 ring-indigo-50">
                        <Maximize size={24} />
                    </button>
                </div>

                {/* Legend Overlay */}
                <div className="absolute bottom-6 left-6 z-[1000] p-4 bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-xl min-w-[180px]">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3">Fleet Context</p>
                    <div className="space-y-2.5">
                        <div className="flex items-center text-[10px] font-black text-slate-500">
                            <div className="h-4 w-4 rounded-lg bg-emerald-500/20 flex items-center justify-center mr-3 border border-emerald-500/30">
                                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                            </div>
                            STANDBY COMMUTER
                        </div>
                        <div className="flex items-center text-[10px] font-black text-slate-500">
                            <div className="h-4 w-4 rounded-lg bg-indigo-500/20 flex items-center justify-center mr-3 border border-indigo-500/30">
                                <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full"></div>
                            </div>
                            ORDER IN PROGRESS
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Map;
