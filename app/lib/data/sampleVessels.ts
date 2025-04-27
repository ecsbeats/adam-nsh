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

// Define the single target zone
const oceanGateZone = {
  name: 'OceanGate Synthetic Zone',
  centerLat: 37.7749,
  centerLon: -130.8600,
  radiusNM: 800,
};

// Calculate bounding box based on center and radius
const NM_PER_DEG_LAT = 60.0;
const latDelta = oceanGateZone.radiusNM / NM_PER_DEG_LAT;
const lonDelta = oceanGateZone.radiusNM / (NM_PER_DEG_LAT * Math.cos(oceanGateZone.centerLat * Math.PI / 180));

const singleLocationBox: {
  name: string;
  latMin: number; latMax: number;
  lonMin: number; lonMax: number;
} = {
  name: oceanGateZone.name,
  latMin: oceanGateZone.centerLat - latDelta,
  latMax: oceanGateZone.centerLat + latDelta,
  lonMin: oceanGateZone.centerLon - lonDelta,
  lonMax: oceanGateZone.centerLon + lonDelta,
};

// Generate 1000 sample vessels within the single OceanGate zone
export const sampleVessels: AISData[] = 
  Array.from({ length: 1000 }, (_, i) => {
    // Use the calculated singleLocationBox
    const lat = randomInRange(singleLocationBox.latMin, singleLocationBox.latMax, 4); // Increased precision
    const lon = randomInRange(singleLocationBox.lonMin, singleLocationBox.lonMax, 4); // Increased precision
    const heading = randomInRange(0, 359);
    const speed = randomInRange(0, 25, 1);
    const typeIndex = randomInRange(0, vesselTypes.length - 1);
    const vesselName = `${singleLocationBox.name.substring(0, 3).toUpperCase()}-${randomString(4, '0123456789')}`;
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
  }
);