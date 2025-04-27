import { AISData } from '../adapters/types'

// Sample vessel data for demonstration
export const sampleVessels: AISData[] = [
  {
    vesselId: '366990063',
    timestamp: new Date().toISOString(),
    position: {
      lat: 37.786,
      lon: -76.289
    },
    heading: 45,
    speed: 12.5,
    vesselInfo: {
      name: 'LIBERTY GRACE',
      callSign: 'WDC9161',
      type: 'Cargo'
    }
  },
  {
    vesselId: '367496940',
    timestamp: new Date().toISOString(),
    position: {
      lat: 37.982,
      lon: -76.392
    },
    heading: 180,
    speed: 8.2,
    vesselInfo: {
      name: 'BALTIMORE',
      callSign: 'WCZ5156',
      type: 'Container Ship'
    }
  },
  {
    vesselId: '367005731',
    timestamp: new Date().toISOString(),
    position: {
      lat: 37.598,
      lon: -76.087
    },
    heading: 270,
    speed: 5.7,
    vesselInfo: {
      name: 'ATLANTIC COUGAR',
      callSign: 'WCY7403',
      type: 'Tanker'
    }
  },
  {
    vesselId: '369970147',
    timestamp: new Date().toISOString(),
    position: {
      lat: 37.525,
      lon: -76.318
    },
    heading: 315,
    speed: 0.1,
    vesselInfo: {
      name: 'CAPE HENRY',
      callSign: 'WDA5658',
      type: 'Pilot Vessel'
    }
  },
  {
    vesselId: '367487242',
    timestamp: new Date().toISOString(),
    position: {
      lat: 38.084,
      lon: -76.156
    },
    heading: 90,
    speed: 9.8,
    vesselInfo: {
      name: 'ANNAPOLIS',
      callSign: 'WDC4621',
      type: 'Passenger'
    }
  }
];