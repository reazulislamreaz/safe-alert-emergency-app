import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';
import {
  createGoogleMap,
  destroyGoogleMap,
  loadGoogleMaps,
  updateGoogleMapPosition,
  type GoogleMapInstance,
} from '../../services/maps';

interface LiveTacticalMapProps {
  lat: number;
  lng: number;
  groupName: string;
  category: string;
  className?: string;
  showGps?: boolean;
}

export const LiveTacticalMap: React.FC<LiveTacticalMapProps> = ({
  lat,
  lng,
  groupName,
  category,
  className,
  showGps = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<GoogleMapInstance | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const mount = async () => {
      if (!mapContainerRef.current) {
        return;
      }

      try {
        const config = await api.getAppConfig();
        const apiKey = config.googleMapsApiKey?.trim();
        if (!apiKey) {
          throw new Error('Google Maps API key is not configured.');
        }

        const maps = await loadGoogleMaps(apiKey);
        if (cancelled || !mapContainerRef.current) {
          return;
        }

        const center = { lat, lng };
        if (handlesRef.current) {
          updateGoogleMapPosition(handlesRef.current, center);
          return;
        }

        handlesRef.current = createGoogleMap(maps, mapContainerRef.current, center);
        setLoadError(null);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load Google Maps.');
        }
      }
    };

    void mount();
  }, [lat, lng]);

  useEffect(() => {
    return () => {
      destroyGoogleMap(handlesRef.current);
      handlesRef.current = null;
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className={className || "w-full h-48 sm:h-56 lg:h-64 rounded-xl overflow-hidden relative shadow-inner bg-[#0B1120] border border-gray-800"}>
      <div ref={mapContainerRef} className="google-map-container w-full h-full z-0" />
      {loadError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0B1120] px-4 text-center">
          <p className="text-[11px] text-gray-400">{loadError}</p>
        </div>
      )}
      {showGps && (
        <div className="absolute top-2 right-2 z-10 bg-black/70 backdrop-blur-sm text-[10px] font-mono text-gray-300 px-2 py-1 rounded-md border border-white/10 max-w-[calc(100%-1rem)] truncate">
          GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>
      )}
      <span className="sr-only">{groupName} {category}</span>
    </div>
  );
};
