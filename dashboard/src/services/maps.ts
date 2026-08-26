type MapsLatLng = { lat: number; lng: number };

type GoogleMap = {
  setCenter: (position: MapsLatLng) => void;
};

type GoogleMarker = {
  setMap: (map: GoogleMap | null) => void;
  setPosition: (position: MapsLatLng) => void;
};

type GoogleCircle = {
  setMap: (map: GoogleMap | null) => void;
  setCenter: (position: MapsLatLng) => void;
};

type GoogleMapsNamespace = {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GoogleMap;
  Marker: new (opts: Record<string, unknown>) => GoogleMarker;
  Circle: new (opts: Record<string, unknown>) => GoogleCircle;
  SymbolPath: { CIRCLE: unknown };
};

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0d1527' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1527' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b9bb4' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1b2740' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b7a94' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#243354' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#07101f' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

let loader: Promise<GoogleMapsNamespace> | null = null;

function mapsFromWindow(): GoogleMapsNamespace | null {
  const google = (window as unknown as { google?: { maps?: GoogleMapsNamespace } }).google;
  return google?.maps ?? null;
}

export function loadGoogleMaps(apiKey: string): Promise<GoogleMapsNamespace> {
  const existing = mapsFromWindow();
  if (existing) {
    return Promise.resolve(existing);
  }
  if (loader) {
    return loader;
  }

  loader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const maps = mapsFromWindow();
      if (!maps) {
        loader = null;
        reject(new Error('Google Maps loaded without a maps namespace.'));
        return;
      }
      resolve(maps);
    };
    script.onerror = () => {
      loader = null;
      reject(new Error('Failed to load Google Maps.'));
    };
    document.head.appendChild(script);
  });

  return loader;
}

export function createGoogleMap(
  maps: GoogleMapsNamespace,
  container: HTMLElement,
  center: MapsLatLng,
): { map: GoogleMap; marker: GoogleMarker; circle: GoogleCircle } {
  const map = new maps.Map(container, {
    center,
    zoom: 14,
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    backgroundColor: '#0d1527',
    styles: DARK_MAP_STYLES,
  });

  const marker = new maps.Marker({
    map,
    position: center,
    icon: {
      path: maps.SymbolPath.CIRCLE,
      scale: 9,
      fillColor: '#EF4444',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 3,
    },
  });

  const circle = new maps.Circle({
    map,
    center,
    radius: 350,
    strokeColor: '#EF4444',
    strokeOpacity: 0.8,
    strokeWeight: 1.5,
    fillColor: '#EF4444',
    fillOpacity: 0.15,
  });

  return { map, marker, circle };
}

export type GoogleMapInstance = ReturnType<typeof createGoogleMap>;

export function updateGoogleMapPosition(
  instance: GoogleMapInstance,
  center: MapsLatLng,
) {
  instance.map.setCenter(center);
  instance.marker.setPosition(center);
  instance.circle.setCenter(center);
}

export function destroyGoogleMap(instance: GoogleMapInstance | null) {
  instance?.marker.setMap(null);
  instance?.circle.setMap(null);
}
