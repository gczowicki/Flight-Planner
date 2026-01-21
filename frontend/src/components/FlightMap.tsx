import { MapContainer, TileLayer, CircleMarker, Polyline, useMapEvents, Tooltip } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { PointInput, NavLogLegOutput } from '../types';

interface FlightMapProps {
  points: PointInput[];
  navLogRows: NavLogLegOutput[];
  onAddPoint: (point: PointInput) => void;
  onRemovePoint: (index: number) => void;
}

function MapClickHandler({
  onAddPoint,
  onRemovePoint,
  points
}: {
  onAddPoint: (point: PointInput) => void;
  onRemovePoint: (index: number) => void;
  points: PointInput[];
}) {
  useMapEvents({
    click(e) {
      onAddPoint({
        lat: e.latlng.lat,
        lon: e.latlng.lng,
        ident: null,
      });
    },
    contextmenu(e) {
      e.originalEvent.preventDefault();
      const clickLat = e.latlng.lat;
      const clickLon = e.latlng.lng;

      let closestIndex = -1;
      let closestDist = Infinity;

      // Iterate BACKWARDS to prioritize the last point added (top of stack)
      for (let i = points.length - 1; i >= 0; i--) {
        const point = points[i];
        const dist = Math.sqrt(
          Math.pow(point.lat - clickLat, 2) + Math.pow(point.lon - clickLon, 2)
        );
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = i;
        }
      }

      // Threshold 0.5 degrees roughly covers mis-clicks
      if (closestIndex >= 0 && closestDist < 0.5) {
        onRemovePoint(closestIndex);
      }
    },
  });
  return null;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

function formatCoord(deg: number): string {
  const absolute = Math.abs(deg);
  const d = Math.floor(absolute);
  const m = Math.round((absolute - d) * 60);
  const mStr = m.toString().padStart(2, '0');
  return `${d}°${mStr}'`;
}

function calculateFiveMinTicks(row: NavLogLegOutput): { center: LatLngExpression; tc: number }[] {
  const { leg, time_min } = row;
  if (time_min < 5) return [];

  const ticks: { center: LatLngExpression; tc: number }[] = [];
  const fullIntervals = Math.floor((time_min - 0.01) / 5);

  for (let i = 1; i <= fullIntervals; i++) {
    const ratio = (i * 5) / time_min;
    const lat = leg.start_point.lat + ratio * (leg.end_point.lat - leg.start_point.lat);
    const lon = leg.start_point.lon + ratio * (leg.end_point.lon - leg.start_point.lon);

    ticks.push({
      center: [lat, lon],
      tc: leg.true_course
    });
  }

  return ticks;
}

function getTickLine(centerLat: number, centerLon: number, tc: number, length: number): LatLngExpression[] {
  const perpAngleRad = toRad(tc + 90);
  const latFactor = Math.cos(toRad(centerLat));

  const dLat = (length / 2) * Math.cos(perpAngleRad);
  const dLon = ((length / 2) * Math.sin(perpAngleRad)) / latFactor;

  return [
    [centerLat + dLat, centerLon + dLon],
    [centerLat - dLat, centerLon - dLon]
  ];
}

export default function FlightMap({ points, navLogRows, onAddPoint, onRemovePoint }: FlightMapProps) {
  const defaultCenter: LatLngExpression = [52.0, 19.0];
  const defaultZoom = 7;

  const polylinePositions: LatLngExpression[] = points.map((p) => [p.lat, p.lon]);

  const allTicks = navLogRows.flatMap(calculateFiveMinTicks);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="h-full w-full cursor-crosshair"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler onAddPoint={onAddPoint} onRemovePoint={onRemovePoint} points={points} />

      {/* Route line */}
      {polylinePositions.length >= 2 && (
        <Polyline positions={polylinePositions} color="red" weight={3} />
      )}

      {/* 5-minute tick marks */}
      {allTicks.map((tick, index) => {
        const [lat, lon] = tick.center as [number, number];
        const tickLine = getTickLine(lat, lon, tick.tc, 0.016);
        return (
          <Polyline
            key={`tick-${index}`}
            positions={tickLine}
            color="red"
            weight={2}
          />
        );
      })}

      {/* Main route points */}
      {points.map((point, index) => (
        <CircleMarker
          key={`point-${index}`}
          center={[point.lat, point.lon]}
          radius={4}
          fillColor="white"
          fillOpacity={1}
          color="red"
          weight={2}
        >
          <Tooltip direction="top" offset={[0, -5]} opacity={1}>
            <div className="text-center">
              <span className="font-bold">WP{index + 1}</span>
              <br />
              <span className="text-xs font-mono">
                {formatCoord(point.lat)} {point.lat >= 0 ? 'N' : 'S'}
                <br />
                {formatCoord(point.lon)} {point.lon >= 0 ? 'E' : 'W'}
              </span>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}