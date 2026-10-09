import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { TONE_HEX } from '@/lib/constants';
import type { Tone } from '@/lib/constants';
import { pointAlong } from '@/lib/geo';
import type { Pt } from '@/lib/geo';

export interface MapMarker { id: string; position: Pt; kind: 'vehicle' | 'pickup' | 'delivery'; label: string; sublabel?: string; tone?: Tone; pulse?: boolean; selected?: boolean; dim?: boolean }
export interface MapRoute { id: string; points: Pt[]; progress: number; selected?: boolean; color: string }

const TILE_URL = import.meta.env.VITE_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TRUCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>';

const iconCache = new Map<string, L.DivIcon>();
function iconFor(m: MapMarker) {
  const color = m.kind === 'pickup' ? '#10b981' : m.kind === 'delivery' ? '#0f172a' : TONE_HEX[m.tone ?? 'slate'];
  const key = `${m.kind}|${color}|${!!m.pulse}|${!!m.selected}|${!!m.dim}`;
  let icon = iconCache.get(key);
  if (!icon) {
    const glyph = m.kind === 'vehicle' ? TRUCK : m.kind === 'pickup' ? 'P' : 'D';
    const cls = ['map-pin', m.kind !== 'vehicle' && 'map-pin--square', m.selected && 'map-pin--selected', m.dim && 'map-pin--dim'].filter(Boolean).join(' ');
    icon = L.divIcon({
      className: '', iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -15],
      html: `<div style="position:relative;color:${color}">${m.pulse ? '<span class="map-pulse"></span>' : ''}<div class="${cls}" style="background:${color};color:#fff">${glyph}</div></div>`,
    });
    iconCache.set(key, icon);
  }
  return icon;
}


function FitTo({ points, fitKey }: { points: Pt[]; fitKey: string }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 9, animate: true });
    // only refit when the focus changes, not on every live position tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map]);
  return null;
}

interface Props { markers: MapMarker[]; routes?: MapRoute[]; fitPoints: Pt[]; fitKey: string; onMarkerClick?: (id: string) => void; className?: string }

export function FleetMap({ markers, routes = [], fitPoints, fitKey, onMarkerClick, className }: Props) {
  return (
    <MapContainer center={[15.5, 77.5]} zoom={6} scrollWheelZoom className={`relative z-0 isolate ${className ?? 'h-full w-full'}`}>
      <TileLayer url={TILE_URL} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
      <FitTo points={fitPoints} fitKey={fitKey} />
      {routes.map((r) => {
        const { index, position } = pointAlong(r.points, r.progress);
        const done = [...r.points.slice(0, index + 1), position];
        return (
          <span key={r.id}>
            <Polyline positions={r.points} pathOptions={{ color: r.color, weight: r.selected ? 4 : 2, opacity: r.selected ? 0.45 : 0.25, dashArray: '6 8' }} />
            <Polyline positions={done} pathOptions={{ color: r.color, weight: r.selected ? 5 : 3, opacity: r.selected ? 1 : 0.6 }} />
          </span>
        );
      })}
      {markers.map((m) => (
        <Marker key={m.id} position={m.position} icon={iconFor(m)} zIndexOffset={m.selected ? 1000 : m.kind === 'vehicle' ? 100 : 0}
          eventHandlers={{ click: () => onMarkerClick?.(m.id) }}>
          <Popup><strong>{m.label}</strong>{m.sublabel && <><br />{m.sublabel}</>}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
