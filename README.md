# FleetOps: Logistics & Fleet Tracking Platform

React 18 + TypeScript + Tailwind CSS + React Router. Runs on mock data out of the box; the API layer is ready to swap.

## Run
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # type-check + production build

Copy `.env.example` to `.env` to configure API URL, mock mode and map tile provider.

## Structure
    src/
      types/            Domain types
      services/api.ts   Single API boundary: in-memory mock or REST (VITE_USE_MOCK)
      data/seed.ts      Deterministic demo data
      store/            Zustand fleet store (load, CRUD, status rules) + toasts
      hooks/            useQueryFilters (filters and pagination live in the URL)
      lib/              constants, geo/route math, metrics selectors, formatters
      components/       ui/ (primitives), layout/, map/ (Leaflet)
      features/         dashboard, vehicles, drivers, shipments, tracking, notifications

## Connecting a real backend
Set `VITE_USE_MOCK=false` and `VITE_API_URL`. Expected routes: `GET/POST /vehicles`, `PATCH/DELETE /vehicles/:id`
(same for drivers, shipments, notifications). Business rules in `useFleetStore` (one vehicle per driver,
status transitions, freeing driver/vehicle on delivery) belong server-side. `tickSimulation` and
`routePoints` are demo-only: replace with live telemetry and real routing geometry.

## Notes
- Forms: react-hook-form + zod with inline errors, uniqueness and cross-field rules.
- Every screen has loading skeletons, empty states and an error state with retry.
- Search, status, driver, vehicle, location and date filters are URL-synced and shareable.
