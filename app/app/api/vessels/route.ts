import { NextResponse } from 'next/server'
import { fetchGlobalAISData } from '@/lib/adapters'

export async function GET() {
  try {
    const vessels = await fetchGlobalAISData()
    return NextResponse.json(vessels)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vessel data' }, { status: 500 })
  }
}