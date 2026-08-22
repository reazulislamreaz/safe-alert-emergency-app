import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LiveTacticalMapProps {
  lat: number;
  lng: number;
  groupName: string;
  category: string;
}

export const LiveTacticalMap: React.FC<LiveTacticalMapProps> = ({
  lat,
  lng,
  groupName,
  category,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing map instance if already initialized to prevent leaflet crash
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Dark CartoDB Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Custom Beacon Icon
      const beaconIcon = L.divIcon({
        className: 'custom-sos-marker',
        html: `
          <div class="beacon-wave"></div>
          <div class="beacon-core"></div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([lat, lng], { icon: beaconIcon }).addTo(map);
      markerRef.current = marker;

      const circle = L.circle([lat, lng], {
        radius: 350,
        color: '#EF4444',
        fillColor: '#EF4444',
        fillOpacity: 0.15,
        weight: 1.5,
      }).addTo(map);
      circleRef.current = circle;

      marker.bindPopup(
        `<div style="font-family: inherit; font-size: 11px; padding: 2px;">
          <strong style="color: #EF4444;">${groupName}</strong><br/>
          <span>${category} Active SOS Beacon</span>
        </div>`
      );
    } catch (err) {
      console.error('Leaflet initialization warning:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, groupName, category]);

  return (
    <div className="w-full h-56 rounded-xl overflow-hidden relative shadow-inner bg-[#0B1120] border border-gray-800">
      {/* Map container DOM node */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating GPS coordinates badge */}
      <div className="absolute top-2.5 right-2.5 z-10 bg-black/70 backdrop-blur-sm text-[10px] font-mono text-gray-300 px-2.5 py-1 rounded-md border border-white/10">
        GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
      </div>
    </div>
  );
};
