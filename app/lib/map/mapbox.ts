// Mapbox configuration and utility functions

export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  style: 'mapbox://styles/mapbox/dark-v11', // Use a dark style for maritime displays
  initialView: {
    longitude: -76.6, // Chesapeake Bay area
    latitude: 37.8,
    zoom: 6,
  },
};

export const validateMapboxToken = (): boolean => {
  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    console.error('Mapbox access token not found in environment variables');
    return false;
  }
  return true;
};