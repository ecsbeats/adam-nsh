// Mapbox configuration and utility functions

export const MAPBOX_CONFIG = {
  // Only use the public token on the client side
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN || '',
  styles: {
    dark: 'mapbox://styles/mapbox/dark-v11', // Dark style for maritime displays
    satellite: 'mapbox://styles/mapbox/satellite-v9', // Satellite imagery
    satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12', // Satellite with streets overlay
  },
  initialView: {
    longitude: -122.42, // San Francisco area
    latitude: 37.77,
    zoom: 9, // Zoomed out view of city and bay
  },
};

export const validateMapboxToken = (): boolean => {
  if (!process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN) {
    console.error('Mapbox public token not found in environment variables');
    return false;
  }
  return true;
};