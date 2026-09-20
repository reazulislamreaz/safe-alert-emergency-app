export function buildShareableLocation(params: {
  latitude: number;
  longitude: number;
  address: string;
}) {
  const mapsUrl = `https://maps.google.com/?q=${params.latitude},${params.longitude}`;
  const copiedText = [
    params.address,
    `GPS: ${params.latitude.toFixed(6)}, ${params.longitude.toFixed(6)}`,
    mapsUrl,
  ].join("\n");

  return {
    address: params.address,
    latitude: params.latitude,
    longitude: params.longitude,
    mapsUrl,
    copiedText,
  };
}

export function buildBatteryRecommendation(params: {
  batteryLevel?: number | null;
  alertActiveMinutes?: number;
}): { show: boolean; title: string; body: string } | null {
  const lowBattery =
    typeof params.batteryLevel === "number" && params.batteryLevel <= 25;
  const longAlert = (params.alertActiveMinutes ?? 0) >= 15;
  if (!lowBattery && !longAlert) {
    return null;
  }
  return {
    show: true,
    title: "Battery tip",
    body:
      "Turn on Battery Saving Mode to help preserve your device's battery and maintain your connection to your Safety Circle. Note: some device battery-saving settings can restrict background location and connectivity — review your device settings carefully.",
  };
}

export const SOUND_KEYS = {
  CIRCLE_NOTIFY: "circle_notify",
  EMERGENCY_ALERT: "emergency_alert",
} as const;
