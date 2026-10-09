import { AlertTriangle, ArrowRight, Calendar, CheckCircle2, ChevronDown, MapPin, Navigation, Package, Truck, Users, Wrench } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataGate } from '@/components/ui/DataGate';
import { PageHeader, ProgressBar, StatCard, Timeline } from '@/components/ui/Misc';
import { DashboardSkeleton } from '@/components/ui/States';
import { LOCATIONS, SHIPMENT_STATUS, TONE_DOT, TONE_HEX, VEHICLE_STATUS } from '@/lib/constants';
import { timeAgo } from '@/lib/format';
import { dashboardStats, deliveriesByDay, recentActivity, vehicleMetrics } from '@/lib/metrics';
import { useFleetStore } from '@/store/useFleetStore';
import { SEVERITY_DOT } from '@/features/notifications/severity';
import { FleetMap } from '@/components/map/FleetMap';
import type { ShipmentStatus, VehicleStatus } from '@/types';
import clsx from 'clsx';

function Dashboard() {
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all');
  const [driverStatusFilter, setDriverStatusFilter] = useState('all');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('all');
  const [location, setLocation] = useState('all');

  const rawVehicles = useFleetStore((s) => s.vehicles);
  const rawDrivers = useFleetStore((s) => s.drivers);
  const rawShipments = useFleetStore((s) => s.shipments);
  const notifications = useFleetStore((s) => s.notifications);

  const vehicles = useMemo(() => {
    return rawVehicles.filter((v) => {
      if (vehicleStatusFilter !== 'all' && v.status !== vehicleStatusFilter) return false;
      if (location !== 'all' && v.city !== location) return false;
      return true;
    });
  }, [rawVehicles, vehicleStatusFilter, location]);

  const drivers = useMemo(() => {
    return rawDrivers.filter((d) => {
      if (driverStatusFilter !== 'all' && d.status !== driverStatusFilter) return false;
      if (location !== 'all' && d.city !== location) return false;
      return true;
    });
  }, [rawDrivers, driverStatusFilter, location]);

  const shipments = useMemo(() => {
    const now = Date.now();
    return rawShipments.filter((s) => {
      if (shipmentStatusFilter !== 'all' && s.status !== shipmentStatusFilter) return false;
      if (location !== 'all' && s.pickup.city !== location && s.delivery.city !== location) return false;
      if (timeframe !== 'all') {
        const timestamp = new Date(s.createdAt || s.scheduledAt).getTime();
        const ageMs = now - timestamp;
        if (timeframe === 'today' && ageMs > 24 * 3600 * 1000) return false;
        if (timeframe === '7d' && ageMs > 7 * 24 * 3600 * 1000) return false;
        if (timeframe === '30d' && ageMs > 30 * 24 * 3600 * 1000) return false;
      }
      return true;
    });
  }, [rawShipments, shipmentStatusFilter, location, timeframe]);

  const daysCount = timeframe === 'today' ? 1 : timeframe === '7d' ? 7 : 14;
  const stats = useMemo(() => dashboardStats(vehicles, drivers, shipments), [vehicles, drivers, shipments]);
  const daily = useMemo(() => deliveriesByDay(shipments, daysCount), [shipments, daysCount]);
  const statusData = useMemo(() => (['delivered', 'in_transit', 'delayed', 'assigned', 'pending', 'cancelled'] as ShipmentStatus[])
    .map((s) => ({ name: SHIPMENT_STATUS[s].label, value: shipments.filter((x) => x.status === s).length, color: s === 'cancelled' ? '#cbd5e1' : TONE_HEX[SHIPMENT_STATUS[s].tone] }))
    .filter((d) => d.value > 0), [shipments]);
  const fleetMix = useMemo(() => (Object.keys(VEHICLE_STATUS) as VehicleStatus[]).map((s) => ({ s, n: vehicles.filter((v) => v.status === s).length })), [vehicles]);
  const topVehicles = useMemo(() => vehicles.map((v) => ({ v, d: vehicleMetrics(v.id, shipments).delivered })).sort((a, b) => b.d - a.d).slice(0, 5), [vehicles, shipments]);
  const alerts = useMemo(() => notifications.filter((n) => !n.read && (n.severity === 'critical' || n.severity === 'warning')).slice(0, 4), [notifications]);
  const activity = useMemo(() => recentActivity(shipments, vehicles, 7), [shipments, vehicles]);
  const maxDeliveries = Math.max(1, ...topVehicles.map((t) => t.d));

  return (
    <>
      <PageHeader title="Overview" description="Live telemetry, delivery throughput, and active fleet status." />

      {/* Filter Bar */}
      <div className="mb-5 rounded-2xl border border-slate-800/80 bg-[#0a101d] p-3.5 shadow-md">
        <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:items-center">
          {/* Vehicle Status */}
          <div className="relative flex items-center w-full sm:w-auto">
            <select
              value={vehicleStatusFilter}
              onChange={(e) => setVehicleStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-800 bg-[#0e1626] py-2 pl-3 pr-8 text-xs font-semibold text-slate-200 transition-colors focus:border-cyan-500/60 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Vehicle Status: All</option>
              <option value="active">Vehicle Status: Active</option>
              <option value="idle">Vehicle Status: Idle</option>
              <option value="maintenance">Vehicle Status: Maintenance</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Driver Status */}
          <div className="relative flex items-center w-full sm:w-auto">
            <select
              value={driverStatusFilter}
              onChange={(e) => setDriverStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-800 bg-[#0e1626] py-2 pl-3 pr-8 text-xs font-semibold text-slate-200 transition-colors focus:border-cyan-500/60 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Driver Status: All</option>
              <option value="available">Driver Status: Available</option>
              <option value="on_trip">Driver Status: On Trip</option>
              <option value="off_duty">Driver Status: Off Duty</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Shipment Status */}
          <div className="relative flex items-center w-full sm:w-auto">
            <select
              value={shipmentStatusFilter}
              onChange={(e) => setShipmentStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-800 bg-[#0e1626] py-2 pl-3 pr-8 text-xs font-semibold text-slate-200 transition-colors focus:border-cyan-500/60 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Shipment Status: All</option>
              <option value="pending">Shipment Status: Pending</option>
              <option value="assigned">Shipment Status: Assigned</option>
              <option value="in_transit">Shipment Status: In Transit</option>
              <option value="delayed">Shipment Status: Delayed</option>
              <option value="delivered">Shipment Status: Delivered</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Timeframe */}
          <div className="relative flex items-center w-full sm:w-auto">
            <Calendar className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-800 bg-[#0e1626] py-2 pl-8 pr-8 text-xs font-semibold text-slate-200 transition-colors focus:border-cyan-500/60 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Timeframe: All Time</option>
              <option value="today">Timeframe: Today</option>
              <option value="7d">Timeframe: Last 7 Days</option>
              <option value="30d">Timeframe: Last 30 Days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Location */}
          <div className="relative flex items-center w-full sm:w-auto">
            <MapPin className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-800 bg-[#0e1626] py-2 pl-8 pr-8 text-xs font-semibold text-slate-200 transition-colors focus:border-cyan-500/60 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Location: All Hubs</option>
              {LOCATIONS.map((loc) => (
                <option key={loc.city} value={loc.city}>
                  Location: {loc.city}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
        <StatCard to="/vehicles" icon={<Truck className="h-5 w-5" />} label="Total Fleet" value={stats.totalVehicles} hint={`${stats.activeVehicles} on route`} tone="blue" />
        <StatCard to="/drivers" icon={<Users className="h-5 w-5" />} label="Active Drivers" value={stats.totalDrivers} hint={`${stats.availableDrivers} available`} tone="slate" />
        <StatCard to="/shipments" icon={<Package className="h-5 w-5" />} label="Active Freight" value={stats.activeShipments} hint="Assigned or in transit" tone="violet" />
        <StatCard to="/shipments?status=delivered" icon={<CheckCircle2 className="h-5 w-5" />} label="Delivered" value={stats.delivered} hint={`${stats.onTimeRate}% on-time rate`} tone="green" />
        <StatCard to="/shipments?status=in_transit" icon={<Navigation className="h-5 w-5" />} label="In Transit" value={stats.inTransit} hint="Live moving vehicles" tone="blue" />
        <StatCard to="/shipments?status=delayed" icon={<AlertTriangle className="h-5 w-5" />} label="Delayed Cargo" value={stats.delayed} hint={stats.delayed ? 'Requires attention' : 'Optimal status'} tone="red" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Delivery Performance" subtitle="Daily completed shipments breakdown (last 14 days)" action={
            <div className="text-right">
              <p className="font-display text-2xl font-extrabold leading-none text-white">{stats.onTimeRate}%</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">On time · avg {stats.avgDeliveryHours.toFixed(1)} h</p>
            </div>
          } />
          <CardBody>
            <div className="h-72" role="img" aria-label="Stacked bar chart of on-time and late deliveries per day">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '600' }}
                    cursor={{ fill: 'rgba(56, 189, 248, 0.05)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                  <Bar dataKey="onTime" name="On time" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="late" name="Late" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Shipment Status Mix" subtitle="Distribution across active stages" />
          <CardBody>
            <div className="h-72" role="img" aria-label="Donut chart of shipments by status">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                    {statusData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '600' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Fleet Efficiency" subtitle="Utilisation, fuel reserves and service due" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5 text-center">
              {[
                ['Utilisation', `${stats.utilization}%`, 'bg-cyan-950/40 border-cyan-800/60 text-cyan-400'],
                ['Avg Fuel', `${stats.avgFuel}%`, 'bg-slate-950/70 border-slate-800 text-slate-100'],
                ['Service Due', stats.maintenanceDue, 'bg-amber-950/40 border-amber-800/60 text-amber-400']
              ].map(([l, v, cls]) => (
                <div key={l as string} className={clsx('rounded-xl border p-2.5', cls as string)}>
                  <p className="font-display text-2xl font-extrabold leading-none">{v}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{l}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Status Breakdown</p>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-950 p-0.5 border border-slate-800" role="img" aria-label="Vehicle status mix">
                {fleetMix.filter((m) => m.n).map((m) => <div key={m.s} className={clsx('h-full rounded-full transition-all', TONE_DOT[VEHICLE_STATUS[m.s].tone])} style={{ width: `${(m.n / vehicles.length) * 100}%` }} title={`${VEHICLE_STATUS[m.s].label}: ${m.n}`} />)}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-400">
                {fleetMix.map((m) => <span key={m.s} className="inline-flex items-center gap-1.5"><span className={clsx('h-2 w-2 rounded-full', TONE_DOT[VEHICLE_STATUS[m.s].tone])} />{VEHICLE_STATUS[m.s].label}: <span className="font-bold text-slate-100">{m.n}</span></span>)}
              </div>
            </div>
            <div>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">Top Performing Vehicles</p>
              <ul className="space-y-2.5">
                {topVehicles.map(({ v, d }) => (
                  <li key={v.id}>
                    <div className="mb-1 flex justify-between text-xs font-semibold">
                      <Link to={`/vehicles/${v.id}`} className="font-bold text-slate-200 hover:text-cyan-400 hover:underline">{v.plate}</Link>
                      <span className="text-slate-400">{d} trips</span>
                    </div>
                    <ProgressBar value={(d / maxDeliveries) * 100} tone="blue" label={`${v.plate} deliveries`} />
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Operational Alerts" action={<Link to="/notifications" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline">View all</Link>} />
          {alerts.length === 0 ? <CardBody><p className="text-sm text-slate-400">No open alerts. Fleet operations normal.</p></CardBody> : (
            <ul className="divide-y divide-slate-800">
              {alerts.map((n) => (
                <li key={n.id}><Link to={n.link ?? '/notifications'} className="flex gap-3 px-5 py-3.5 hover:bg-slate-800/50 transition-colors">
                  {n.type === 'maintenance' ? <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />}
                  <span className="min-w-0"><span className="block text-sm font-bold text-white">{n.title}</span><span className="block text-xs text-slate-300 mt-0.5">{n.message}</span><span className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400"><span className={clsx('h-1.5 w-1.5 rounded-full', SEVERITY_DOT[n.severity])} />{timeAgo(n.createdAt)}</span></span>
                </Link></li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent Fleet Dispatch Activity" />
          <CardBody><Timeline items={activity} /></CardBody>
        </Card>
      </div>

      {/* Live Tracking Dispatch Map Shortmap Card (Bottom) */}
      <Card className="mt-5">
        <CardHeader
          title="Live Tracking Dispatch Map"
          subtitle="Interactive telemetry map preview"
          action={
            <Link to="/tracking" className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline">
              Open Full Map <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <CardBody>
          <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-[#050914] py-12 px-4 text-center">
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <FleetMap
                markers={vehicles.map((v) => ({
                  id: v.id,
                  position: [v.base.lat, v.base.lng],
                  kind: 'vehicle',
                  label: v.plate,
                  sublabel: `${v.make} ${v.model} · ${v.city}`,
                  tone: v.status === 'active' ? 'blue' : v.status === 'maintenance' ? 'amber' : 'slate',
                }))}
                fitPoints={vehicles.map((v) => [v.base.lat, v.base.lng])}
                fitKey="dashboard-shortmap"
              />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-blue-500/30 bg-blue-600/20 text-cyan-400 shadow-lg shadow-blue-500/10">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-display text-base font-bold text-white">
                {stats.activeVehicles} Vehicles Currently Live on Routes
              </h3>
              <Link
                to="/tracking"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all duration-150 hover:bg-blue-500 active:scale-95"
              >
                Launch Interactive Telemetry
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}


export default function DashboardPage() {
  return <DataGate skeleton={<DashboardSkeleton />}><Dashboard /></DataGate>;
}
