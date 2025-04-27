// Server-side Mapbox utilities
// This file is only used on the server and not exposed to the client

// Access to the secret token (only on server)
export const getSecureMapboxToken = (): string => {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error('Server-side Mapbox token not configured');
  }
  return token;
};

// For server-side rendering or API routes that need to use the secure token
export const getMapboxGeocodingUrl = (query: string): string => {
  const token = getSecureMapboxToken();
  return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}`;
};

// For fetching map data securely from the server
export const getMapboxDataUrl = (mapId: string): string => {
  const token = getSecureMapboxToken();
  return `https://api.mapbox.com/v4/${mapId}.json?secure&access_token=${token}`;
};