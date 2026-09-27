import { useState } from 'react';

interface GeolocationState {
  loading: boolean;
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    latitude: null,
    longitude: null,
    error: null,
  });

  const getCurrentLocation = (
    onSuccess?: (coords: { latitude: number; longitude: number }) => void,
    onError?: (err: GeolocationPositionError) => void
  ) => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          loading: false,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
        });
        onSuccess?.({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        onError?.(error);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return { ...state, getCurrentLocation };
}
