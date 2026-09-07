import { useEffect, useState } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface GeolocationState {
  position: GeoPosition | null;
  error: string | null;
}

/**
 * Watches the browser's live position while `enabled` is true (requesting
 * permission the moment it turns on), and clears position/error as soon as
 * it turns back off. Cleans up the watch on unmount or when disabled.
 */
export function useLiveGeolocation(enabled: boolean): GeolocationState {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPosition(null);
      setError(null);
      return;
    }

    if (!("geolocation" in navigator)) {
      setError("La géolocalisation n'est pas prise en charge par ce navigateur.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Position refusée - autorisez la géolocalisation pour voir votre position sur la carte."
            : "Impossible d'obtenir votre position.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { position, error };
}
