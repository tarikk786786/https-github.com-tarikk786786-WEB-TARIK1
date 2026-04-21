import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { 
  MapPin, 
  Map as MapIcon, 
  Car, 
  Phone, 
  User, 
  ArrowRight, 
  X, 
  ChevronRight,
  Navigation,
  Loader2,
  Bike as BikeIcon,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Menu,
  CarFront,
  Zap,
  Shield,
  Trophy,
  Users,
  DollarSign,
  Settings,
  AlertCircle,
  MoreVertical,
  History,
  TrendingUp,
  LayoutDashboard,
  Lock
} from 'lucide-react';
import { LeafletMap } from './MapComponent';
import { 
  TRIP_TYPES, 
  UPI_ID, 
  WHATSAPP_NUMBER,
  DHANBAD_CENTER,
  TripType
} from './constants';



const ai = null; // AI removed

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '24px'
};

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

// --- Components ---

const Header = ({ setView, onAboutClick }: { setView: (v: ViewMode) => void, onAboutClick: () => void }) => (
  <header className="fixed top-0 left-0 w-full z-[100] px-4 pt-4 pointer-events-none">
    <div className="container mx-auto flex items-center justify-between pointer-events-auto max-w-4xl">
      <div className="flex items-center gap-3 px-1 py-1 rounded-full cursor-pointer" onClick={() => setView('customer')}>
        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
          <Navigation className="w-5 h-5 text-yellow-400" />
        </div>
        <span className="font-black text-xl tracking-tight text-white uppercase italic">UMA<span className="text-yellow-400">TAXI</span></span>
      </div>
      
      <div className="flex items-center gap-2">
        <button onClick={onAboutClick} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all">
          <AlertCircle className="w-5 h-5" />
        </button>
        <button onClick={() => setView('driver')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all">
          <User className="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
);

const AutocompleteInput = ({ onSelect, placeholder, icon, value: externalValue, transparent = false }: any) => {
  const [value, setValue] = useState(externalValue || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setValue(externalValue || '');
  }, [externalValue]);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`);
      const data = await res.json();
      setSuggestions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    setShowSuggestions(true);
    fetchSuggestions(val);
  };

  const handleSelect = (item: any) => {
    setValue(item.display_name);
    setShowSuggestions(false);
    onSelect(item.display_name, parseFloat(item.lat), parseFloat(item.lon));
  };

  return (
    <div className="relative w-full">
      <div className={`flex items-center rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-yellow-400/50 transition-all duration-300 ${transparent ? 'bg-white/5 border border-white/10' : 'bg-zinc-800 border border-white/5 shadow-xl'}`}>
        <span className="text-yellow-400 mr-3">{icon}</span>
        <input
          value={value}
          onChange={handleInput}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="bg-transparent w-full outline-none text-white text-sm font-medium placeholder:text-white/20"
        />
      </div>
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
          >
            {suggestions.map((item: any, i: number) => (
              <button
                key={i}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                className="w-full text-left px-4 py-3 text-xs text-white/70 hover:bg-yellow-400 hover:text-black transition-colors border-b border-white/5 last:border-none"
              >
                {item.display_name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

type ViewMode = 'customer' | 'driver' | 'admin';

export default function App() {
  const [view, setView] = useState<ViewMode>('customer');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminTab, setAdminTab] = useState<'overview' | 'fleet' | 'config'>('overview');
  const [adminCreds, setAdminCreds] = useState({ user: '', pass: '' });
  
  const [phone, setPhone] = useState('');
  const [pickup, setPickup] = useState({ address: '', lat: 0, lng: 0 });
  const [drop, setDrop] = useState({ address: '', lat: 0, lng: 0 });
  const [selectedVehicleKey, setSelectedVehicleKey] = useState('mini');
  const [distance, setDistance] = useState(0);
  const [route, setRoute] = useState<any[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [sheetSnapPoint, setSheetSnapPoint] = useState<0 | 1 | 2>(1); // 0: closed, 1: half, 2: full
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Trigger auto-detect on mount
  useEffect(() => {
    // Only call detectLocation once on mount if view is customer and lat is 0
    if (view === 'customer' && pickup.lat === 0 && !isDetectingLocation) {
      detectLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Real-time State
  const [rides, setRides] = useState<any[]>([]);
  const [bugs, setBugs] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({
    appName: "UMATAXI",
    whatsapp: "917787860016",
    upiId: "917787860016@ybl",
    serviceStatus: "Active"
  });
  const [currentRide, setCurrentRide] = useState<any>(null);

  // Driver Panel State
  const [driverId, setDriverId] = useState('');
  const [driverData, setDriverData] = useState<any>(null);
  const [isDriverLoggedIn, setIsDriverLoggedIn] = useState(false);
  const [isRegisteringAsDriver, setIsRegisteringAsDriver] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [driverRegData, setDriverRegData] = useState({ name: '', phone: '', vehicle: '' });
  const [bugDescription, setBugDescription] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ridesRes, pricingRes, bugsRes, driversRes, configRes] = await Promise.all([
          fetch('/api/rides'),
          fetch('/api/pricing'),
          fetch('/api/bugs'),
          fetch('/api/drivers'),
          fetch('/api/config')
        ]);
        setRides(await ridesRes.json());
        setPricing(await pricingRes.json());
        setBugs(await bugsRes.json());
        setDrivers(await driversRes.json());
        setConfig(await configRes.json());
      } catch (e) {
        console.error("API Error:", e);
        // Fallback for pricing if server is down during dev
        if (!pricing) {
          setPricing({
            mini: { label: 'Mini', base: 20, perkm: 10 },
            sedan: { label: 'Sedan', base: 20, perkm: 12 },
          });
        }
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateConfig = async (newConfig: any) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setConfig(data.config);
        alert("System Config Updated");
      }
    } catch (e) {
      alert("Update failed");
    }
  };

  // Driver Location Sharing
  useEffect(() => {
    if (isDriverLoggedIn && driverData) {
      const shareLocation = () => {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          await fetch('/api/driver/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driverId: driverData.id, location })
          });
        });
      };
      const locInterval = setInterval(shareLocation, 10000);
      return () => clearInterval(locInterval);
    }
  }, [isDriverLoggedIn, driverData]);

  // GPS Auto Pickup
  const detectLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const results = await res.json();
          const address = results.display_name || `${lat}, ${lng}`;
          setPickup({ address, lat, lng });
          // Auto-scroll to form for mobile UX
          document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
          setPickup({ address: `${lat}, ${lng}`, lat, lng });
        }
        setIsDetectingLocation(false);
      },
      (error) => {
        let msg = "Unable to retrieve location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location access denied. Please enter your pickup address manually or tap the map.";
        }
        alert(msg);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleMapClick = async (e: any) => {
    if (e.latlng) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const results = await res.json();
        const address = results.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setDrop({ address, lat, lng });
      } catch (err) {
        setDrop({ address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng });
      }
    }
  };

  useEffect(() => {
    if (pickup.lat && drop.lat) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes.length > 0) {
            const routeCoords = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
            setRoute(routeCoords);
            setDistance(Math.round(data.routes[0].distance / 100) / 10); // meters to kilometers with 1 decimal
          }
        })
        .catch(err => {
          console.error("Routing error:", err);
          // Accurate Haversine Fallback Formula
          const R = 6371; // Earth radius in KM
          const dLat = (drop.lat - pickup.lat) * Math.PI / 180;
          const dLon = (drop.lng - pickup.lng) * Math.PI / 180;
          const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(pickup.lat * Math.PI/180) *
            Math.cos(drop.lat * Math.PI/180) *
            Math.sin(dLon/2) *
            Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const haversineDist = R * c;
          setDistance(Math.round(haversineDist * 10) / 10);
          setRoute([]);
        });
    }
  }, [pickup.lat, pickup.lng, drop.lat, drop.lng]);

  const fareEstimate = useMemo(() => {
    if (!pricing || !pricing[selectedVehicleKey] || isNaN(distance)) return 0;
    const vehicle = pricing[selectedVehicleKey];
    const fare = Math.round(vehicle.base + (distance * vehicle.perkm));
    return isNaN(fare) ? 0 : fare;
  }, [pricing, selectedVehicleKey, distance]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup.address || !drop.address || !phone) {
      alert("Please fill in all booking details including your phone number.");
      return;
    }
    
    if (!distance || distance === 0) {
      alert("Distance calculation is still in progress or could not be determined. Please set your destinations on the map.");
      return;
    }

    const rideData = {
      pickup,
      drop,
      vehicle: pricing[selectedVehicleKey].label,
      phone,
      fare: fareEstimate,
      distance
    };

    try {
      const res = await fetch('/api/book-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rideData)
      });
      const data = await res.json();
      setCurrentRide(data.ride);
      
      const msg = `${config.appName} Ride\nPickup: ${pickup.address}\nDrop: ${drop.address}\nVehicle: ${pricing[selectedVehicleKey].label}\nDistance: ${distance} KM\nFare: ₹${fareEstimate}\nContact: ${phone}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (err) {
      console.error("Booking Error:", err);
    }
  };

  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId })
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (!data.driver.isApproved) {
          alert("Your account is pending admin approval. Please wait for validation.");
          return;
        }
        setDriverData(data.driver);
        setIsDriverLoggedIn(true);
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Login failed");
    }
  };

  const handleDriverRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/driver/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverRegData)
      });
      alert("Registration submitted! Admin will validate your profile soon.");
      setIsRegisteringAsDriver(false);
    } catch (e) {
      alert("Registration failed");
    }
  };

  const approveDriver = async (id: string, approve: boolean) => {
    try {
      await fetch('/api/drivers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: id, approve })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const updateRideStatus = async (rideId: string, status: string, driverId?: string) => {
    try {
      await fetch('/api/ride/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, status, driverId: driverId || driverData.id })
      });
      alert(`Ride ${status}!`);
    } catch (e) {
      console.error("Update Status Error:", e);
    }
  };

  const reportBug = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/report-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: bugDescription, user: isDriverLoggedIn ? 'driver' : 'customer' })
      });
      alert("Bug reported. Thanks!");
      setBugDescription('');
    } catch (e) {
      console.error("Report Bug Error:", e);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCreds.user === 'admin' && adminCreds.pass === '1234') {
      setIsAdminLoggedIn(true);
    } else {
      alert("Invalid Credentials");
    }
  };

  const updatePricing = async (newPricing: any) => {
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPricing)
      });
      const data = await res.json();
      setPricing(data.pricing);
      alert("Pricing updated successfully!");
    } catch (e) {
      console.error("Update Error:", e);
    }
  };

  if (!pricing) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-10 h-10 text-yellow-400 animate-spin" /></div>;

  return (
              <div className="bg-[#0b0b0b] text-white min-h-screen selection:bg-yellow-400 selection:text-black font-sans relative">
      <Header setView={setView} onAboutClick={() => setShowAbout(true)} />

      <AnimatePresence mode="wait">
        {view === 'customer' && (
          <motion.div
            key="customer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
          >
            {/* Map Canvas - Background */}
            <div className="absolute inset-0 z-0">
               <LeafletMap pickup={pickup} drop={drop} drivers={drivers} route={route} />
            </div>

            {/* Premium Sliding Panel */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: sheetSnapPoint === 0 ? "85%" : sheetSnapPoint === 1 ? "45%" : "10%" }}
              transition={{ type: "spring", damping: 25, stiffness: 150 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-[#0c0c0c] border-t border-white/10 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col max-w-2xl mx-auto"
            >
              {/* Drag Handle Bar */}
              <div 
                className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing touch-none"
                onClick={() => setSheetSnapPoint(prev => prev === 2 ? 1 : 2)}
              >
                <div className="w-12 h-1.5 bg-white/10 rounded-full" />
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-12 space-y-8">
                {!currentRide ? (
                  <>
                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black italic tracking-widest uppercase text-white">{config.appName} <span className="text-yellow-400">RIDE</span></h3>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] font-black tracking-widest uppercase text-white/30">Service Active</span>
                          </div>
                        </div>
                        {distance > 0 && (
                          <div className="text-right">
                            <div className="text-[9px] font-black uppercase text-white/20 tracking-widest">Est. Travel</div>
                            <div className="text-lg font-black text-white">{distance} <span className="text-yellow-400">KM</span></div>
                          </div>
                        )}
                      </div>

                      {/* Inputs Group */}
                      <div className="space-y-3">
                        <div className="relative group">
                          <AutocompleteInput
                            placeholder="Current Station (Pickup)"
                            onSelect={(address: string, lat: number, lng: number) => setPickup({ address, lat, lng })}
                            icon={<MapPin className="w-4 h-4 text-blue-500" />}
                            value={pickup.address}
                            transparent
                          />
                        </div>
                        <div className="relative group">
                          <AutocompleteInput
                            placeholder="Terminal Destination"
                            onSelect={(address: string, lat: number, lng: number) => setDrop({ address, lat, lng })}
                            icon={<MapIcon className="w-4 h-4 text-orange-500" />}
                            value={drop.address}
                            transparent
                          />
                        </div>
                      </div>
                    </div>

                    {distance > 0 ? (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        {/* Vehicle Selection - Horizontal Scroll */}
                        <div className="space-y-3">
                           <div className="flex items-center justify-between px-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Select Fleet Tier</span>
                              <span className="text-[10px] font-bold text-yellow-400 capitalize">Best Value Guaranteed</span>
                           </div>
                           <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
                             {Object.entries(pricing || {}).map(([key, data]: [string, any]) => {
                               const isSelected = selectedVehicleKey === key;
                               const fare = Math.round(data.base + (distance * data.perkm));
                               return (
                                 <button
                                   key={key}
                                   onClick={() => setSelectedVehicleKey(key)}
                                   className={`min-w-[140px] p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-3 relative overflow-hidden group ${isSelected ? 'bg-yellow-400 border-yellow-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.2)]' : 'bg-white/[0.03] border-white/5 text-white/40 hover:border-white/10'}`}
                                 >
                                   <div className={`p-3 rounded-2xl ${isSelected ? 'bg-black/10' : 'bg-white/5'}`}>
                                      {key === 'bike' ? <BikeIcon className="w-6 h-6" /> : <CarFront className="w-6 h-6" />}
                                   </div>
                                   <div className="text-center space-y-0.5">
                                      <div className="text-[10px] font-black uppercase tracking-wider">{data.label}</div>
                                      <div className="text-xl font-black tabular-nums">₹{fare}</div>
                                   </div>
                                   {isSelected && (
                                     <motion.div layoutId="selection-glow" className="absolute -bottom-1 left-0 right-0 h-1 bg-black" />
                                   )}
                                 </button>
                               );
                             })}
                           </div>
                        </div>

                        {/* Booking Summary & Phone */}
                        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                           <div className="space-y-4">
                              <div className="flex justify-between items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                                 <span>Contact Identification</span>
                                 <div className="w-3 h-3" />
                              </div>
                              <input
                                type="tel"
                                placeholder="Enter WhatsApp Number"
                                className="w-full bg-black/40 border border-white/10 px-6 py-5 rounded-2xl outline-none focus:border-yellow-400/50 text-base font-black tracking-tight placeholder:opacity-20 transition-all"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                              />
                           </div>
                           
                           <div className="space-y-4 pt-2">
                             <div className="flex justify-between items-center px-2">
                                <div className="space-y-0.5">
                                   <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Final Pricing</div>
                                   <div className="text-3xl font-black text-white italic">₹{fareEstimate}</div>
                                </div>
                                <div className="text-right">
                                   <div className="text-[9px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-3 py-1 rounded-full">Secure Booking</div>
                                </div>
                             </div>
                             
                             <button
                               onClick={handleBooking}
                               className="w-full bg-yellow-400 text-black py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-yellow-400/20 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                             >
                               Confirm Ride <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                             </button>
                           </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="space-y-8 py-4">
                        <div className="grid grid-cols-2 gap-4">
                           <button onClick={detectLocation} className="p-8 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 flex flex-col items-center gap-3 group hover:bg-blue-500/20 transition-all">
                              <Navigation className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-all" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Auto Detect GPS</span>
                           </button>
                           <button onClick={() => setSheetSnapPoint(0)} className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 flex flex-col items-center gap-3 group hover:bg-white/10 transition-all">
                              <MapIcon className="w-6 h-6 text-white/40 group-hover:scale-110 transition-all" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Browse Large Map</span>
                           </button>
                        </div>

                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-black border border-white/5 space-y-4">
                           <div className="flex items-center gap-3">
                              <ShieldCheck className="w-5 h-5 text-yellow-500" />
                              <span className="text-xs font-black uppercase tracking-widest text-white">FLEETAPP Premium Safety</span>
                           </div>
                           <p className="text-[11px] leading-relaxed text-white/40 font-medium italic">"All our fleet segments are verified and monitored in real-time for your security."</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-20 text-center space-y-8">
                    <div className="relative inline-block">
                       <div className="absolute inset-0 bg-yellow-400 rounded-full blur-[40px] opacity-20 animate-pulse" />
                       <div className="relative w-32 h-32 bg-zinc-950 rounded-[3rem] border-2 border-yellow-400 rotate-12 flex items-center justify-center">
                          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin -rotate-12" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white">Dispatch <span className="text-yellow-400">Active</span></h3>
                       <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em]">{currentRide.status} • Tracking Vehicle</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                      <button onClick={() => window.open(`https://wa.me/${config.whatsapp}`, '_blank')} className="py-5 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-white/40 uppercase hover:bg-white/10 transition-all">Control Center</button>
                      <button onClick={() => setCurrentRide(null)} className="py-5 bg-yellow-400 rounded-2xl text-[10px] font-black text-black uppercase shadow-lg shadow-yellow-400/10">Abort & Search</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Action Buttons */}
            <div className={`fixed right-6 z-[100] flex flex-col gap-4 transition-all duration-500 ${sheetSnapPoint === 2 ? 'bottom-[92%]' : 'bottom-10'}`}>
               <div className="w-14 h-14" /> {/* Blank placeholder for help button */}
               <button onClick={() => {
                 if (sheetSnapPoint === 0) setSheetSnapPoint(1);
                 else if (sheetSnapPoint === 1) setSheetSnapPoint(2);
                 else setSheetSnapPoint(1);
               }} className="w-14 h-14 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all text-white">
                  {sheetSnapPoint === 2 ? <X className="w-6 h-6" /> : <ChevronRight className="w-6 h-6 rotate-[-90deg]" />}
               </button>
               <button onClick={() => setView('admin')} className="w-14 h-14 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all text-white/40 hover:text-yellow-400">
                  <Settings className="w-5 h-5" />
               </button>
            </div>
          </motion.div>
        )}

        {view === 'driver' && (
          <motion.div
            key="driver"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="pt-24 pb-20 px-4 container mx-auto max-w-sm h-screen flex flex-col"
          >
            {!isDriverLoggedIn ? (
              <div className="flex-1 flex flex-col justify-center gap-8">
                 <div className="space-y-4 text-center">
                    <div className="w-16 h-16 bg-yellow-400 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-yellow-400/10">
                      <Car className="w-8 h-8 text-black" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black uppercase tracking-tight">Driver <span className="text-yellow-400">Portal</span></h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Sign in to start driving</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                  <div className="bg-zinc-900 border border-white/5 p-6 rounded-[2rem] space-y-6">
                    <form onSubmit={handleDriverLogin} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-white/30 ml-1">Phone Number</label>
                        <input
                          type="text"
                          placeholder="Your Mobile"
                          className="w-full bg-white/5 border border-white/5 px-5 py-3.5 rounded-xl outline-none focus:border-yellow-400/50 transition-all text-sm font-medium"
                          value={driverId}
                          onChange={e => setDriverId(e.target.value)}
                        />
                      </div>
                      <button className="w-full bg-yellow-400 text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                        Go Online
                      </button>
                    </form>
                    <div className="text-center pt-2">
                       <button onClick={() => setIsRegisteringAsDriver(true)} className="text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-yellow-400 transition-colors">Join our fleet</button>
                    </div>
                  </div>
                 </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-6 h-full">
                {/* Driver Identity */}
                <div className="glass p-6 rounded-[2.5rem] border-white/10 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                         <User className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-tight">{driverData.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                           <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Active Status</span>
                        </div>
                      </div>
                   </div>
                   <button onClick={() => setIsDriverLoggedIn(false)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20 hover:text-red-400 transition-all">
                      <X className="w-4 h-4" />
                   </button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-10">
                   {/* Wallet Overview */}
                   <div className="relative group">
                     <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-[2.5rem] blur opacity-50" />
                     <div className="relative glass p-8 rounded-[2.5rem] border-white/10 space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Shift Earnings</div>
                        <div className="flex items-center gap-3">
                           <DollarSign className="w-6 h-6 text-yellow-400" />
                           <div className="text-4xl font-black text-white tabular-nums">₹{rides.filter(r => r.driverId === driverData.id && r.status === 'completed').reduce((acc, r) => acc + r.fare, 0)}</div>
                        </div>
                     </div>
                   </div>

                   {/* Queue / Active Jobs */}
                   <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Operational Inbox</h3>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      </div>

                      {rides.filter(r => r.status === 'pending').length === 0 && (
                        <div className="glass p-12 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center space-y-4 opacity-40">
                           <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center"><Navigation className="w-5 h-5" /></div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-center">Searching for nearby riders...</p>
                        </div>
                      )}

                      {rides.filter(r => r.status === 'pending').map((r, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="glass p-6 rounded-[2.5rem] border-white/10 space-y-6 bg-zinc-950/40"
                        >
                           <div className="flex justify-between items-start">
                              <div className="space-y-0.5">
                                <div className="text-xs font-black uppercase tracking-tight">New Trip Request</div>
                                <div className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">{r.vehicle} Category</div>
                              </div>
                              <div className="text-xl font-black tracking-tighter">₹{r.fare}</div>
                           </div>
                           <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                 <div className="w-5 h-5 bg-white/5 rounded-lg flex items-center justify-center text-white/40"><MapPin className="w-3 h-3" /></div>
                                 <div className="text-[10px] font-medium text-white/60 truncate italic">{r.pickup.address}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="w-5 h-5 bg-yellow-400/10 rounded-lg flex items-center justify-center text-yellow-400"><Navigation className="w-3 h-3" /></div>
                                 <div className="text-[10px] font-medium text-white/60 truncate italic">{r.drop.address}</div>
                              </div>
                           </div>
                           <button 
                             onClick={() => updateRideStatus(r.id, 'accepted', driverData.id)}
                             className="w-full bg-white text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                           >
                             Intercept Order
                           </button>
                        </motion.div>
                      ))}

                      {/* Active Missions */}
                      {rides.filter(r => r.status === 'accepted' && r.driverId === driverData.id).map((r, i) => (
                        <div key={i} className="bg-yellow-400 p-6 rounded-[2.5rem] space-y-6 shadow-2xl shadow-yellow-400/20">
                           <div className="flex justify-between items-center text-black">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                <span className="font-black text-xs uppercase tracking-tight">Live Mission</span>
                              </div>
                              <div className="font-black text-xl">₹{r.fare}</div>
                           </div>
                           <div className="bg-black/10 p-5 rounded-2xl space-y-3">
                              <div className="flex items-center gap-3">
                                 <div className="w-2 h-2 rounded-full bg-black/40" />
                                 <div className="text-[10px] font-bold text-black/60 truncate">{r.pickup.address}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="w-2 h-2 rounded-sm bg-black" />
                                 <div className="text-[10px] font-bold text-black/60 truncate">{r.drop.address}</div>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button 
                                onClick={() => window.open(`https://wa.me/${r.phone}`, '_blank')}
                                className="flex-1 bg-black text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                              >
                                <Phone className="w-3 h-3" /> Intelligence
                              </button>
                              <button 
                                onClick={() => updateRideStatus(r.id, 'completed', driverData.id)}
                                className="flex-1 bg-zinc-950/20 text-black border border-black/10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest"
                              >
                                Terminate
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {view === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="min-h-screen pt-24 pb-20 px-4 container mx-auto max-w-6xl"
          >
            {!isAdminLoggedIn ? (
              <div className="max-w-md mx-auto space-y-6">
                <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2rem] shadow-2xl space-y-8">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-yellow-400 rounded-xl mx-auto flex items-center justify-center mb-2">
                      <Lock className="w-6 h-6 text-black" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Admin <span className="text-yellow-400">Login</span></h3>
                  </div>
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-2">Access ID (admin)</label>
                       <input
                         type="text"
                         placeholder="Username: admin"
                         className="w-full bg-white/5 border border-white/5 px-5 py-4 rounded-2xl outline-none focus:border-yellow-400 transition-all text-sm font-bold"
                         value={adminCreds.user}
                         onChange={e => setAdminCreds({...adminCreds, user: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-2">Encryption Key (1234)</label>
                       <input
                         type="password"
                         placeholder="Password: 1234"
                         className="w-full bg-white/5 border border-white/5 px-5 py-4 rounded-2xl outline-none focus:border-yellow-400 transition-all text-sm font-bold"
                         value={adminCreds.pass}
                         onChange={e => setAdminCreds({...adminCreds, pass: e.target.value})}
                       />
                    </div>
                    <button className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all mt-4">Login System</button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Header with Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 py-6 bg-zinc-900/50 border border-white/5 rounded-[2.5rem]">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight">{config.appName} <span className="text-yellow-400">Control</span></h2>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20">System Nominal</span>
                    </div>
                  </div>
                  <div className="flex bg-black/40 p-1 rounded-2xl">
                    <button onClick={() => setAdminTab('overview')} className={`px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${adminTab === 'overview' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/10' : 'text-white/30 hover:text-white'}`}>Overview</button>
                    <button onClick={() => setAdminTab('fleet')} className={`px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${adminTab === 'fleet' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/10' : 'text-white/30 hover:text-white'}`}>Fleet</button>
                    <button onClick={() => setAdminTab('config')} className={`px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${adminTab === 'config' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/10' : 'text-white/30 hover:text-white'}`}>Config</button>
                    <button onClick={() => setIsAdminLoggedIn(false)} className="ml-3 w-10 h-10 flex items-center justify-center text-white/20 hover:text-red-400 transition-all"><X className="w-5 h-5" /></button>
                  </div>
                </div>

                {adminTab === 'overview' && (
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8 text-white">
                       {/* System Status Panel */}
                       <div className="glass p-8 rounded-[3rem] border-white/10 bg-zinc-950/60 transition-all">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-yellow-400/20 border border-yellow-400/30 rounded-2xl flex items-center justify-center"><LayoutDashboard className="w-6 h-6 text-yellow-400" /></div>
                            <div>
                               <h3 className="text-xs font-black uppercase tracking-widest text-white/60">System Health</h3>
                               <span className="text-[8px] font-bold text-yellow-500 uppercase tracking-widest">Operational Ready</span>
                            </div>
                          </div>
                          <div className="p-5 border border-white/5 rounded-2xl mb-2 text-[11px] leading-relaxed text-white/40 italic">
                            Monitoring core platform metrics. All subsystems are currently reporting nominal status.
                          </div>
                       </div>

                       <div className="glass p-8 rounded-[2.5rem] border-white/10 space-y-2">
                         <div className="text-[9px] font-black uppercase tracking-widest text-white/20">Earnings Today</div>
                         <div className="text-4xl font-black tabular-nums">₹{rides.reduce((acc, r) => acc + r.fare, 0).toLocaleString()}</div>
                       </div>
                    </div>

                    <div className="lg:col-span-2 glass p-8 rounded-[3.5rem] border-white/10 bg-zinc-950/40">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Recent Rides</h3>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                           <span className="text-[8px] font-black text-red-500 uppercase">Live Stream</span>
                        </div>
                      </div>
                      <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                        {rides.slice().reverse().map((r, i) => (
                          <div key={i} className="flex justify-between items-center p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-tight">{r.vehicle}</span>
                                <span className={`text-[7px] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-widest ${r.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-400/10 text-yellow-500'}`}>{r.status}</span>
                              </div>
                              <div className="opacity-30 text-[9px] font-medium italic truncate w-64">{r.drop.address}</div>
                            </div>
                            <div className="text-yellow-400 font-black text-sm">₹{r.fare}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'fleet' && (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="glass p-8 rounded-[3rem] border-white/10 space-y-6">
                      <div className="flex items-center gap-3">
                         <Users className="w-5 h-5 text-orange-500" />
                         <h3 className="text-xs font-black uppercase tracking-widest text-white">Active Fleet</h3>
                      </div>
                      <div className="space-y-3">
                         {drivers.filter(d => d.isApproved).map((d, i) => (
                           <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
                              <div>
                                 <div className="text-xs font-black uppercase">{d.name}</div>
                                 <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{d.vehicle} • {d.phone}</div>
                              </div>
                              <div className="px-3 py-1 bg-green-500/10 rounded-lg text-[8px] font-black text-green-500 uppercase tracking-widest">Active</div>
                           </div>
                         ))}
                      </div>
                    </div>

                    <div className="glass p-8 rounded-[3rem] border-yellow-400/20 bg-zinc-950/40 space-y-6">
                      <div className="flex items-center gap-3">
                         <Users className="w-5 h-5 text-yellow-400" />
                         <h3 className="text-xs font-black uppercase tracking-widest text-white">Driver Waitlist</h3>
                      </div>
                      <div className="space-y-3 overflow-y-auto no-scrollbar max-h-[500px]">
                        {drivers.filter(d => !d.isApproved).length === 0 ? (
                           <div className="py-20 text-center text-[11px] font-black uppercase tracking-widest text-white/10 border border-dashed border-white/5 rounded-3xl">Waitlist Clear</div>
                        ) : (
                          drivers.filter(d => !d.isApproved).map((d, i) => (
                            <div key={i} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl flex justify-between items-center">
                               <div>
                                  <div className="text-xs font-black uppercase">{d.name}</div>
                                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{d.vehicle}</div>
                               </div>
                               <div className="flex gap-2">
                                  <button onClick={() => approveDriver(d.id, true)} className="p-2.5 bg-green-500 text-black rounded-xl hover:scale-110 active:scale-95 transition-all"><CheckCircle2 className="w-4 h-4" /></button>
                                  <button onClick={() => approveDriver(d.id, false)} className="p-2.5 bg-red-500 text-white rounded-xl hover:scale-110 active:scale-95 transition-all"><X className="w-4 h-4" /></button>
                               </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'config' && (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="glass p-8 rounded-[3rem] border-white/10 space-y-8 bg-zinc-950/40">
                      <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-3"><Settings className="w-5 h-5 text-white/20" /> System Settings</h3>
                      <div className="space-y-5">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-2">Platform Branding</label>
                            <input value={config.appName} onChange={e => setConfig({...config, appName: e.target.value})} className="w-full bg-white/5 border border-white/5 px-5 py-4 rounded-2xl outline-none focus:border-yellow-400 transition-all font-bold text-sm" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-2">Operational WhatsApp</label>
                            <input value={config.whatsapp} onChange={e => setConfig({...config, whatsapp: e.target.value})} className="w-full bg-white/5 border border-white/5 px-5 py-4 rounded-2xl outline-none focus:border-yellow-400 transition-all font-bold text-sm" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-2">Merchant UPI</label>
                            <input value={config.upiId} onChange={e => setConfig({...config, upiId: e.target.value})} className="w-full bg-white/5 border border-white/5 px-5 py-4 rounded-2xl outline-none focus:border-yellow-400 transition-all font-bold text-sm" />
                         </div>
                         <button onClick={() => updateConfig(config)} className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Update System Core</button>
                      </div>
                    </div>

                    <div className="glass p-8 rounded-[3rem] border-white/10 space-y-8 bg-zinc-950/40">
                      <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-3"><DollarSign className="w-5 h-5 text-white/20" /> Pricing Matrix</h3>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                        {pricing && Object.entries(pricing).map(([key, data]: [string, any]) => (
                           <div key={key} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"><span className="text-white/60">{data.label}</span> <span className="text-white/20">{key}</span></div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                   <label className="text-[8px] font-black uppercase tracking-widest text-white/30 block mb-1 ml-1">Base Price (₹)</label>
                                   <input type="number" value={data.base} onChange={e => { let p = {...pricing}; p[key].base = Number(e.target.value); setPricing(p); }} className="w-full bg-black/60 border border-white/5 px-4 py-3 rounded-xl text-xs font-bold outline-none" />
                                 </div>
                                 <div>
                                   <label className="text-[8px] font-black uppercase tracking-widest text-white/30 block mb-1 ml-1">Per KM (₹)</label>
                                   <input type="number" value={data.perkm} onChange={e => { let p = {...pricing}; p[key].perkm = Number(e.target.value); setPricing(p); }} className="w-full bg-black/60 border border-white/5 px-4 py-3 rounded-xl text-xs font-bold outline-none" />
                                 </div>
                              </div>
                           </div>
                        ))}
                      </div>
                      <button onClick={() => updatePricing(pricing)} className="w-full bg-zinc-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Sync Global Rates</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRegisteringAsDriver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[120] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm glass p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(250,204,21,0.2)] border-white/5 space-y-8"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black neon-text-yellow">Join our Fleet</h3>
                <button onClick={() => setIsRegisteringAsDriver(false)} className="glass w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleDriverRegister} className="space-y-4">
                <div className="space-y-4">
                  <div className="glass rounded-xl px-4 py-3 border-white/10 focus-within:border-yellow-400 transition-all">
                    <input 
                      required
                      placeholder="Full Name" 
                      className="bg-transparent w-full outline-none text-white text-sm"
                      value={driverRegData.name}
                      onChange={(e) => setDriverRegData({...driverRegData, name: e.target.value})}
                    />
                  </div>
                  <div className="glass rounded-xl px-4 py-3 border-white/10 focus-within:border-yellow-400 transition-all">
                    <input 
                      required
                      placeholder="WhatsApp Number" 
                      className="bg-transparent w-full outline-none text-white text-sm"
                      value={driverRegData.phone}
                      onChange={(e) => setDriverRegData({...driverRegData, phone: e.target.value})}
                    />
                  </div>
                  <div className="glass rounded-xl px-4 py-3 border-white/10 focus-within:border-yellow-400 transition-all">
                    <input 
                      required
                      placeholder="Vehicle Name & Model" 
                      className="bg-transparent w-full outline-none text-white text-sm"
                      value={driverRegData.vehicle}
                      onChange={(e) => setDriverRegData({...driverRegData, vehicle: e.target.value})}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full h-14 bg-yellow-400 text-black rounded-2xl font-black shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:brightness-110 active:scale-95 transition-all uppercase">
                  Submit Application
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* About Modal */}
        {showAbout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-2xl glass p-10 rounded-[3rem] relative shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setShowAbout(false)}
                className="absolute top-6 right-6 p-2 glass rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close About"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="space-y-8 text-center">
                <div className="w-20 h-20 bg-yellow-400 rounded-3xl mx-auto flex items-center justify-center shadow-2xl">
                  <Navigation className="w-10 h-10 text-black fill-current" />
                </div>
                <h2 className="text-4xl font-black neon-text-yellow uppercase tracking-tighter">FLEET<span className="text-yellow-400">APP</span></h2>
                <div className="space-y-6 text-white/60 text-lg leading-relaxed text-left text-justify">
                  <p>
                    <span className="text-yellow-400 font-bold">{config.appName}</span> is your premium gateway to hassle-free travel. 
                    Redefining local mobility, we prioritize speed, safety, and transparency above all.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass p-4 rounded-2xl border-white/5 space-y-2">
                       <h4 className="text-yellow-400 font-black text-xs uppercase tracking-widest">Our Fleet</h4>
                       <p className="text-[10px] leading-relaxed">From quick Bike Taxis for urban mobility to Premium SUVs for your family trips, we have it all.</p>
                    </div>
                    <div className="glass p-4 rounded-2xl border-white/5 space-y-2">
                       <h4 className="text-yellow-400 font-black text-xs uppercase tracking-widest">Smart Pricing</h4>
                       <p className="text-[10px] leading-relaxed">No surprises. Flat base rates starting at ₹20 and transparent per-km billing.</p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <h4 className="text-white font-black text-center text-sm uppercase tracking-widest">User Favorites</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { name: "Rahul S.", review: "Best way to travel in Dhanbad." },
                        { name: "Priya M.", review: "I feel safe taking this service home." }
                      ].map((r, i) => (
                        <div key={i} className="glass p-4 rounded-xl text-[10px]">
                          <p className="italic text-white/40 mb-2">"{r.review}"</p>
                          <p className="font-bold text-yellow-400">— {r.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {bugDescription && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
              <h3 className="text-xl font-black">Something Wrong?</h3>
              <form onSubmit={reportBug} className="space-y-4">
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe the issue or bug..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-red-500 text-sm"
                  value={bugDescription}
                  onChange={e => setBugDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <button 
                    type="submit"
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/20"
                  >
                    Submit Report
                  </button>
                  <button 
                    type="button"
                    onClick={() => setBugDescription('')}
                    className="bg-white/10 px-6 py-3 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {view !== 'customer' && <Footer />}

      <div className="fixed bottom-6 left-6 z-[100] hidden md:flex items-center gap-2 bg-zinc-900 border border-white/5 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white/30 truncate max-w-[150px]">
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        Fleet Ready
      </div>
    </div>
  );
}

const Footer = () => (
  <footer className="bg-zinc-950 pt-20 pb-12 border-t border-white/5 px-4 mt-20">
    <div className="container mx-auto grid md:grid-cols-2 gap-12 text-center md:text-left">
      <div className="space-y-6">
        <div className="flex items-center justify-center md:justify-start gap-2">
          <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-black" />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase">FLEET<span className="text-yellow-400">APP</span></span>
        </div>
        <p className="text-white/40 text-sm leading-relaxed max-w-sm">
          Simple. Reliable. Premium. The future of local transport is here.
        </p>
      </div>
      <div className="flex flex-col items-center md:items-end gap-4">
        <h5 className="font-bold text-sm uppercase tracking-widest text-yellow-400">Support</h5>
        <p className="text-white/40 text-sm">Bank More, Dhanbad, Jharkhand</p>
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="text-yellow-400 font-black text-sm hover:underline">Contact Support</a>
      </div>
    </div>
  </footer>
);
