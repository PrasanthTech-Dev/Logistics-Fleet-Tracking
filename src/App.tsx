import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/ui/States';

// Route-level code splitting keeps the map and chart libraries out of the initial bundle.
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const VehiclesPage = lazy(() => import('@/features/vehicles/VehiclesPage'));
const VehicleDetailPage = lazy(() => import('@/features/vehicles/VehicleDetailPage'));
const DriversPage = lazy(() => import('@/features/drivers/DriversPage'));
const DriverDetailPage = lazy(() => import('@/features/drivers/DriverDetailPage'));
const ShipmentsPage = lazy(() => import('@/features/shipments/ShipmentsPage'));
const ShipmentDetailPage = lazy(() => import('@/features/shipments/ShipmentDetailPage'));
const TrackingPage = lazy(() => import('@/features/tracking/TrackingPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage'));
const NotFoundPage = lazy(() => import('@/features/NotFoundPage'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="drivers/:id" element={<DriverDetailPage />} />
          <Route path="shipments" element={<ShipmentsPage />} />
          <Route path="shipments/:id" element={<ShipmentDetailPage />} />
          <Route path="tracking" element={<TrackingPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
