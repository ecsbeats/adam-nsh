import { AISData } from '../adapters/types'

// Function to generate a random number within a range
const randomInRange = (min: number, max: number, decimals: number = 0): number => {
  const factor = Math.pow(10, decimals);
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Function to generate a random string
const randomString = (length: number, chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string => {
  let result = '';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// Predefined vessel types
const vesselTypes = [
  'Cargo', 'Tanker', 'Passenger', 'Fishing', 'Tug', 'Container Ship', 
  'Sailing', 'Pleasure Craft', 'High Speed Craft', 'Other'
];

// Define 10 geographical locations (bounding boxes)
interface LocationBox {
  name: string;
  latMin: number; latMax: number;
  lonMin: number; lonMax: number;
}

const locations: LocationBox[] = [
  { name: 'Chesapeake Bay', latMin: 36.5, latMax: 38.5, lonMin: -77.0, lonMax: -75.5 },
  { name: 'English Channel', latMin: 49.0, latMax: 51.0, lonMin: -6.0, lonMax: 2.0 },
  { name: 'Strait of Malacca', latMin: 1.0, latMax: 6.0, lonMin: 98.0, lonMax: 104.0 },
  { name: 'Gulf of Mexico', latMin: 18.0, latMax: 30.0, lonMin: -98.0, lonMax: -81.0 },
  { name: 'Mediterranean Sea (East)', latMin: 31.0, latMax: 37.0, lonMin: 18.0, lonMax: 36.0 },
  { name: 'North Sea', latMin: 51.0, latMax: 61.0, lonMin: -4.0, lonMax: 9.0 },
  { name: 'South China Sea', latMin: 5.0, latMax: 20.0, lonMin: 105.0, lonMax: 120.0 },
  { name: 'Persian Gulf', latMin: 24.0, latMax: 30.0, lonMin: 48.0, lonMax: 56.0 },
  { name: 'Sea of Japan', latMin: 33.0, latMax: 45.0, lonMin: 128.0, lonMax: 142.0 },
  { name: 'Caribbean Sea', latMin: 10.0, latMax: 22.0, lonMin: -85.0, lonMax: -60.0 },
];

// Generate 1000 sample vessels (100 per location)
export const sampleVessels: AISData[] = locations.flatMap(location => 
  Array.from({ length: 100 }, (_, i) => {
    const lat = randomInRange(location.latMin, location.latMax, 3);
    const lon = randomInRange(location.lonMin, location.lonMax, 3);
    const heading = randomInRange(0, 359);
    const speed = randomInRange(0, 25, 1);
    const typeIndex = randomInRange(0, vesselTypes.length - 1);
    const vesselName = `${location.name.substring(0, 3).toUpperCase()}-${randomString(4, '0123456789')}`;
    const callSign = `W${randomString(3)}${randomString(4, '0123456789')}`;
    const vesselId = randomString(9, '0123456789');

    return {
      vesselId: vesselId,
      timestamp: new Date(Date.now() - randomInRange(0, 3600000)).toISOString(), // Timestamp within the last hour
      position: {
        lat: lat,
        lon: lon
      },
      heading: heading,
      speed: speed,
      vesselInfo: {
        name: vesselName,
        callSign: callSign,
        type: vesselTypes[typeIndex]
      }
    };
  })
);