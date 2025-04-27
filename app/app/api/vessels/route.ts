import { NextResponse } from 'next/server'
import { fetchGlobalAISData } from '@/lib/adapters'
import { sampleVessels } from '@/lib/data/sampleVessels'
// Using the server-side utilities that have access to the secure token
import { getSecureMapboxToken } from '@/lib/server/mapbox'

// This runs on the server only
export async function GET() {
  try {
    // We can safely access secure tokens here
    const mapboxToken = getSecureMapboxToken();
    
    // In production, we would use the secure token to call APIs
    // const vessels = await fetchGlobalAISData(mapboxToken)
    
    // For now, just use sample data
    // Note: We're keeping API credentials secure on the server
    return NextResponse.json({
      vessels: sampleVessels,
      // Don't include sensitive info like tokens in response
      meta: {
        source: 'AMIS API',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch vessel data' }, { status: 500 })
  }
}