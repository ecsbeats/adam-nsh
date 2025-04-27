// Client-side API utilities for fetching vessel data
// This file uses the public API and not direct access to sensitive tokens

import { AISData } from '../adapters/types';

export interface VesselsResponse {
  vessels: AISData[];
  meta: {
    source: string;
    timestamp: string;
  };
}

// Fetch vessel data from our secure API
export async function fetchVessels(): Promise<AISData[]> {
  try {
    const response = await fetch('/api/vessels');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: VesselsResponse = await response.json();
    return data.vessels;
  } catch (error) {
    console.error('Error fetching vessels:', error);
    return [];
  }
}