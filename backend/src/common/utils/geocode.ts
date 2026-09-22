/**
 * Reverse-geocode helpers for live location / copy-location.
 * Uses OpenStreetMap Nominatim when reachable; falls back to a GPS label.
 */

export function formatGpsLabel(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  const fallback = formatGpsLabel(latitude, longitude);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
      `&lat=${encodeURIComponent(String(latitude))}` +
      `&lon=${encodeURIComponent(String(longitude))}` +
      `&zoom=18&addressdetails=0`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "SafetyCircle/1.0 (emergency-response)",
      },
    });
    if (!response.ok) {
      return fallback;
    }
    const data = (await response.json()) as { display_name?: string };
    const name = data.display_name?.trim();
    return name || fallback;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
