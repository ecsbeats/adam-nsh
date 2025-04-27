'use client'

import { useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import { AISData } from '@/lib/adapters/types'

interface VesselMarkerProps {
  map: mapboxgl.Map | null
  vessel: AISData
}

export default function VesselMarker({ map, vessel }: VesselMarkerProps) {
  useEffect(() => {
    if (!map) return
    
    // Create a vessel element
    const el = document.createElement('div')
    el.className = 'vessel-marker'
    el.style.width = '16px'
    el.style.height = '16px'
    el.style.borderRadius = '50%'
    el.style.background = '#60a5fa' // blue-400
    el.style.border = '2px solid #fff'
    el.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.2)'
    el.style.cursor = 'pointer'
    
    // Set rotation based on vessel heading
    if (vessel.heading) {
      const arrow = document.createElement('div')
      arrow.style.position = 'absolute'
      arrow.style.top = '0'
      arrow.style.left = '50%'
      arrow.style.marginLeft = '-1px'
      arrow.style.width = '2px'
      arrow.style.height = '8px'
      arrow.style.background = '#fff'
      arrow.style.transform = `rotate(${vessel.heading}deg)`
      arrow.style.transformOrigin = 'bottom center'
      el.appendChild(arrow)
    }
    
    // Create the popup
    const popup = new mapboxgl.Popup({ offset: 15 })
      .setHTML(`
        <div>
          <h3 style="font-weight: bold;">${vessel.vesselInfo?.name || 'Unknown Vessel'}</h3>
          <p>MMSI: ${vessel.vesselId}</p>
          ${vessel.vesselInfo?.type ? `<p>Type: ${vessel.vesselInfo.type}</p>` : ''}
          ${vessel.speed ? `<p>Speed: ${vessel.speed} knots</p>` : ''}
          ${vessel.heading ? `<p>Heading: ${vessel.heading}°</p>` : ''}
        </div>
      `)
    
    // Create the marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([vessel.position.lon, vessel.position.lat])
      .setPopup(popup)
      .addTo(map)
    
    // Cleanup function to remove marker when unmounting
    return () => {
      marker.remove()
    }
  }, [map, vessel])
  
  return null
}