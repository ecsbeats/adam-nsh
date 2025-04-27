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
    
    // Create a vessel element that's visible on both dark and satellite backgrounds
    const el = document.createElement('div')
    el.className = 'vessel-marker'
    el.style.width = '16px'
    el.style.height = '16px'
    el.style.borderRadius = '50%'
    el.style.background = '#60a5fa' // blue-400
    el.style.border = '2px solid rgba(255, 255, 255, 0.9)'
    el.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.5), 0 0 8px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.3)'
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
    
    // Create the popup with improved styling for visibility
    const popup = new mapboxgl.Popup({ 
      offset: 15,
      className: 'vessel-popup' // Custom class for styling
    })
      .setHTML(`
        <div style="padding: 4px; font-family: sans-serif;">
          <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 6px 0; color: #1a1a1a; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 5px;">
            ${vessel.vesselInfo?.name || 'Unknown Vessel'}
          </h3>
          <div style="font-size: 12px; color: #333;">
            <p style="margin: 3px 0;"><strong>MMSI:</strong> ${vessel.vesselId}</p>
            ${vessel.vesselInfo?.type ? `<p style="margin: 3px 0;"><strong>Type:</strong> ${vessel.vesselInfo.type}</p>` : ''}
            ${vessel.speed ? `<p style="margin: 3px 0;"><strong>Speed:</strong> ${vessel.speed} knots</p>` : ''}
            ${vessel.heading ? `<p style="margin: 3px 0;"><strong>Heading:</strong> ${vessel.heading}°</p>` : ''}
          </div>
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