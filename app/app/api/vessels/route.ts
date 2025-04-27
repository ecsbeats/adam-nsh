import { NextResponse } from 'next/server'
import { fetchGlobalAISData } from '@/lib/adapters'
import { sampleVessels } from '@/lib/data/sampleVessels'
// Using the server-side utilities that have access to the secure token
import { getSecureMapboxToken } from '@/lib/server/mapbox'

const PYTHON_BACKEND_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'; // Default if not set in env

// Define the type for the expected vessel data
interface VesselData {
  MMSI: number;
  BaseDateTime: string; // Assuming ISO format string from Python
  LAT: number;
  LON: number;
  SOG: number;
  COG: number;
  Heading: number;
  VesselName: string;
  IMO: string;
  CallSign: string;
  VesselType: number;
  Status: number;
  Length: number;
  Width: number;
  Draft: number;
  Cargo: number;
  TransceiverClass: string;
}

// This runs on the server only
export async function GET(request: Request) {
  console.log('Received GET request for vessels');
  const geoQueryUrl = `${PYTHON_BACKEND_URL}/api/data/geo`;

  // Bounding box from ai/data.py test
  const boundingBox = {
      min_lat: 34.9337,
      max_lat: 41.1082,
      min_lon: -126.6365,
      max_lon:  -118.2023,
      table: 'ais_data' // Specify the table if needed, otherwise default is used
  };

  try {
    console.log(`Fetching data from ${geoQueryUrl} with body:`, boundingBox);
    const response = await fetch(geoQueryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(boundingBox),
    });

    console.log(`Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching data from Python backend: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Backend error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: VesselData[] = await response.json();
    console.log(`Successfully fetched ${data.length} vessel records.`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in GET /api/vessels:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Return a 500 error with more detail
    return NextResponse.json({ error: 'Failed to fetch vessel data', details: errorMessage }, { status: 500 });
  }
}