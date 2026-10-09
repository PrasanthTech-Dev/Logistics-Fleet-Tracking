import clsx from 'clsx';
import { Bell, LayoutDashboard, MapPin, Menu, Package, Plus, Search, Shield, Truck, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useFleetStore } from '@/store/useFleetStore';
import { Toaster } from '@/components/ui/Toaster';
import { NotificationBell } from './NotificationBell';
import { ShipmentForm } from '@/features/shipments/ShipmentForm';
import { VehicleForm } from '@/features/vehicles/VehicleForm';
import { DriverForm } from '@/features/drivers/DriverForm';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vehicles', label: 'Vehicles', icon: Truck },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/shipments', label: 'Shipments', icon: Package },
  { to: '/tracking', label: 'Live Tracking', icon: MapPin },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20">
        <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
          <Shield className="h-5 w-5 text-cyan-400" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-display text-xl font-bold tracking-tight text-white">Fleet<span className="text-blue-400">Ops</span></span>
        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Logistics & Fleet Tracking.</span>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const unread = useFleetStore((s) => s.notifications.filter((n) => !n.read).length);
  return (
    <nav aria-label="Main" className="space-y-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'group relative flex items-center gap-3.5 px-4 py-3 text-sm font-semibold transition-all duration-150 rounded-r-xl',
              isActive
                ? 'bg-cyan-500/10 text-cyan-400 font-bold'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-1 bottom-1 w-1.5 rounded-r-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              )}
              <Icon
                className={clsx(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                )}
                aria-hidden
              />
              <span className={clsx('flex-1', isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 group-hover:text-slate-200')}>
                {label}
              </span>
              {to === '/notifications' && unread > 0 && (
                <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-bold text-slate-950 shadow-xs">
                  {unread}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

const PAGE_META: Record<string, { title: string }> = {
  '/': { title: 'Overview' },
  '/vehicles': { title: 'Vehicles' },
  '/drivers': { title: 'Drivers' },
  '/shipments': { title: 'Shipments' },
  '/tracking': { title: 'Live Tracking' },
  '/notifications': { title: 'Notifications' },
};

export default function AppLayout() {
  const [drawer, setDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [modalType, setModalType] = useState<'shipment' | 'vehicle' | 'driver' | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useFleetStore((s) => s.drivers);
  const shipments = useFleetStore((s) => s.shipments);
  const status = useFleetStore((s) => s.status);
  const load = useFleetStore((s) => s.load);
  const { pathname } = useLocation();

  const meta = Object.entries(PAGE_META).find(([key]) => key === '/' ? pathname === '/' : pathname.startsWith(key))?.[1] ?? PAGE_META['/'];

  useEffect(() => { if (status === 'idle') void load(); }, [status, load]);
  useEffect(() => { setDrawer(false); window.scrollTo(0, 0); }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchRef.current && !searchRef.current.contains(e.target as Node) &&
        mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setQuickActionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { vehicles: [], drivers: [], shipments: [] };
    return {
      vehicles: vehicles.filter((v) => v.plate.toLowerCase().includes(q) || v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.city.toLowerCase().includes(q)).slice(0, 4),
      drivers: drivers.filter((d) => d.name.toLowerCase().includes(q) || d.phone.includes(q) || d.city.toLowerCase().includes(q)).slice(0, 4),
      shipments: shipments.filter((s) => s.id.toLowerCase().includes(q) || s.customer.name.toLowerCase().includes(q) || s.pickup.city.toLowerCase().includes(q) || s.delivery.city.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [searchQuery, vehicles, drivers, shipments]);

  const hasResults = results.vehicles.length > 0 || results.drivers.length > 0 || results.shipments.length > 0;

  const searchResultsDropdown = (
    <div className="absolute top-full right-0 sm:right-0 mt-2 w-full sm:w-96 rounded-2xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md z-50 max-h-[70vh] overflow-y-auto space-y-3">
      {!hasResults ? (
        <div className="px-3 py-4 text-center text-xs font-semibold text-slate-400">
          No results matching "{searchQuery}"
        </div>
      ) : (
        <>
          {results.vehicles.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Vehicles</div>
              <div className="mt-1 space-y-1">
                {results.vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      navigate(`/vehicles/${v.id}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-slate-800/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Truck className="h-4 w-4 text-cyan-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">{v.plate}</p>
                        <p className="text-[11px] text-slate-400">{v.make} {v.model} · {v.city}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 capitalize">{v.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.shipments.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Shipments</div>
              <div className="mt-1 space-y-1">
                {results.shipments.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      navigate(`/shipments/${s.id}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-slate-800/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="h-4 w-4 text-indigo-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">{s.id}</p>
                        <p className="text-[11px] text-slate-400">{s.customer.name} ({s.pickup.city} → {s.delivery.city})</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 capitalize">{s.status.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.drivers.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Drivers</div>
              <div className="mt-1 space-y-1">
                {results.drivers.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      navigate(`/drivers/${d.id}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-slate-800/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">{d.name}</p>
                        <p className="text-[11px] text-slate-400">{d.phone} · {d.city}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 capitalize">{d.status.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800/80 bg-slate-900 px-4 py-5 lg:flex">
        <div className="mb-8 px-2"><Brand /></div>
        <NavList />
      </aside>

      {/* Sidebar Mobile Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-900 px-4 py-5">
            <div className="mb-8 flex items-center justify-between px-2">
              <Brand />
              <button aria-label="Close menu" onClick={() => setDrawer(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <NavList onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      {/* Sticky Top Header Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md">
        {/* Top Navbar Row */}
        <div className="relative flex h-16 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3.5 z-10">
            <button
              aria-label="Open menu"
              onClick={() => setDrawer(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="hidden sm:block font-display text-2xl font-extrabold tracking-tight text-white leading-tight">{meta.title}</h1>
          </div>

          {/* Mobile Centered Title */}
          <div className="absolute inset-x-0 flex justify-center pointer-events-none sm:hidden">
            <h1 className="font-display text-xl font-extrabold tracking-tight text-white leading-tight">{meta.title}</h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-3.5 shrink-0 z-10">
            {/* Desktop Search Bar */}
            <div ref={searchRef} className="relative hidden sm:flex items-center">
              <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search for something"
                className="w-48 md:w-72 rounded-full border border-slate-800/90 bg-[#121929] py-2 pl-10 pr-8 text-sm font-normal text-slate-100 placeholder-slate-400/90 transition-all duration-200 focus:border-cyan-500/50 focus:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                  className="absolute right-3 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {searchOpen && searchQuery.trim() !== '' && searchResultsDropdown}
            </div>

            {/* Quick Action Button & Dropdown */}
            <div ref={quickRef} className="relative hidden sm:block">
              <button
                onClick={() => setQuickActionOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition-all duration-150"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Quick Action</span>
              </button>

              {quickActionOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-800 bg-[#0e1626]/95 p-1.5 shadow-2xl backdrop-blur-md z-50">
                  <button
                    onClick={() => {
                      setQuickActionOpen(false);
                      setModalType('shipment');
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-100 hover:bg-slate-800/70 transition-colors"
                  >
                    <Package className="h-4 w-4 text-blue-400" />
                    <span>New Shipment</span>
                  </button>
                  <button
                    onClick={() => {
                      setQuickActionOpen(false);
                      setModalType('vehicle');
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-100 hover:bg-slate-800/70 transition-colors"
                  >
                    <Truck className="h-4 w-4 text-emerald-400" />
                    <span>Add Vehicle</span>
                  </button>
                  <button
                    onClick={() => {
                      setQuickActionOpen(false);
                      setModalType('driver');
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-100 hover:bg-slate-800/70 transition-colors"
                  >
                    <UserPlus className="h-4 w-4 text-amber-400" />
                    <span>Add Driver</span>
                  </button>
                </div>
              )}
            </div>

            <NotificationBell />
          </div>
        </div>

        {/* Mobile Search Bar Row (Shown on mobile screens < sm) */}
        <div className="block sm:hidden border-t border-slate-800/60 px-4 py-2.5 bg-[#090e1b]">
          <div ref={mobileSearchRef} className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search for something"
              className="w-full rounded-full border border-slate-800/90 bg-[#121929] py-2 pl-10 pr-8 text-sm font-normal text-slate-100 placeholder-slate-400/90 transition-all duration-200 focus:border-cyan-500/50 focus:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {searchOpen && searchQuery.trim() !== '' && searchResultsDropdown}
          </div>
        </div>
      </header>

      {/* Quick Action Creation Modals */}
      <ShipmentForm open={modalType === 'shipment'} onClose={() => setModalType(null)} />
      <VehicleForm open={modalType === 'vehicle'} vehicle={null} onClose={() => setModalType(null)} />
      <DriverForm open={modalType === 'driver'} driver={null} onClose={() => setModalType(null)} />

      {/* Main Content */}
      <main className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8"><Outlet /></main>
      <Toaster />
    </div>
  );
}

