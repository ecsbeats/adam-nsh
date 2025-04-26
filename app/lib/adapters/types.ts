export interface DataSource {
  id: string
  name: string
  type: 'ais' | 'satellite' | 'camera' | 'osint'
  status: 'active' | 'inactive' | 'error'
}

export interface AISData {
  vesselId: string
  timestamp: string
  position: {
    lat: number
    lon: number
  }
  heading?: number
  speed?: number
  vesselInfo?: {
    name?: string
    callSign?: string
    type?: string
  }
}