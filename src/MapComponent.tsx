import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RecenterMap = ({ center, bounds }: { center: [number, number], bounds?: L.LatLngBoundsExpression }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.flyTo(center, 15);
    }
  }, [center, bounds, map]);
  return null;
};

export const LeafletMap = ({ pickup, drop, drivers, route }: any) => {
  const defaultCenter: [number, number] = [23.7957, 86.4304]; // Dhanbad Center
  const center = pickup.lat ? [pickup.lat, pickup.lng] as [number, number] : defaultCenter;

  const customPickupIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  const customDropIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149060.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  const customDriverIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  let bounds: L.LatLngBoundsExpression | undefined;
  if (pickup.lat && drop.lat) {
    bounds = [
      [pickup.lat, pickup.lng],
      [drop.lat, drop.lng]
    ];
  }

  return (
    <MapContainer 
      center={center} 
      zoom={14} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <RecenterMap center={center} bounds={bounds} />
      
      {pickup.lat !== 0 && (
        <Marker position={[pickup.lat, pickup.lng]} icon={customPickupIcon} />
      )}
      
      {drop.lat !== 0 && (
        <Marker position={[drop.lat, drop.lng]} icon={customDropIcon} />
      )}
      
      {drivers && drivers.filter((d: any) => d.isApproved && d.location && d.location.lat).map((d: any) => (
        <Marker key={d.id} position={[d.location.lat, d.location.lng]} icon={customDriverIcon} />
      ))}

      {route && route.length > 0 && (
        <Polyline positions={route} pathOptions={{ color: '#FABE2C', weight: 6 }} />
      )}
    </MapContainer>
  );
};
