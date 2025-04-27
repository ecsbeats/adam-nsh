// Client-side API utilities for fetching vessel data
// This file uses the public API and not direct access to sensitive tokens

import { AISData } from '../adapters/types';

// Remove the VesselsResponse interface as the API returns the array directly
// export interface VesselsResponse {
//   vessels: AISData[];
//   meta: {
//     source: string;
//     timestamp: string;
//   };
// }

// Fetch vessel data from our secure API
// The function now expects to receive AISData[] directly
export async function fetchVessels(): Promise<AISData[]> {
  try {
    console.log("Fetching vessels from /api/vessels...");
    const response = await fetch('/api/vessels');

    console.log(`API response status: ${response.status}`);
    if (!response.ok) {
       const errorText = await response.text();
       console.error(`API error fetching vessels: ${response.status}`, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    // Expect the data to be the array directly
    const data: AISData[] = await response.json();
    console.log(`Successfully fetched ${data.length} vessels.`);
    return data; // Return the array directly
  } catch (error) {
    console.error('Error fetching vessels:', error);
    return []; // Return empty array on error
  }
}