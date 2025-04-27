'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { AISData } from '@/lib/adapters/types'

interface VesselMarkerProps {
  map: mapboxgl.Map | null
  vessel: AISData
}

export default function VesselMarker({ map, vessel }: VesselMarkerProps) {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map || !vessel.position) return
    
    // Create a container div for the marker
    const container = document.createElement('div');
    container.style.width = '20px'; // Match SVG size or adjust as needed
    container.style.height = '20px';
    container.style.cursor = 'pointer';

    // --- Create SVG Ship Icon --- 
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const iconSize = 20; // Size of the icon in pixels
    svgEl.setAttribute('width', `${iconSize}px`);
    svgEl.setAttribute('height', `${iconSize}px`);
    svgEl.setAttribute('viewBox', '0 0 24 24'); // ViewBox for the SVG path
    svgEl.style.overflow = 'visible'; // Prevent clipping if stroke is wide
    
    // Define the ship shape (simple triangle pointing up)
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 2 L4 22 L12 18 L20 22 Z'); // Path data for triangle
    path.setAttribute('fill', '#60a5fa'); // blue-400 fill
    path.setAttribute('stroke', 'white'); // White border
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linejoin', 'round');
    svgEl.appendChild(path);
    
    // Apply rotation directly to the SVG element
    if (typeof vessel.heading === 'number' && !isNaN(vessel.heading)) {
      svgEl.style.transform = `rotate(${vessel.heading}deg)`;
    } else {
      svgEl.style.transform = 'rotate(0deg)'; // Default to pointing North if no heading
    }
    // --- End SVG Ship Icon --- 

    // Append the SVG to the container div
    container.appendChild(svgEl);

    // Create the popup with improved styling for visibility
    const popup = new mapboxgl.Popup({ 
      offset: 15, // Adjust offset if needed for the new icon size
      className: 'vessel-popup' // Custom class for styling
    })
      .setHTML(`
        <div style="padding: 4px; font-family: sans-serif;">
          <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 6px 0; color: #1a1a1a; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 5px;">
            ${vessel.vesselInfo?.name || 'Unknown Vessel'}
          </h3>
          <div style="font-size: 12px; color: #333;">
            <p style="margin: 3px 0;"><strong>MMSI:</strong> ${vessel.MMSI}</p>
            ${vessel.vesselInfo?.type ? `<p style="margin: 3px 0;"><strong>Type:</strong> ${vessel.vesselInfo.type}</p>` : ''}
            ${vessel.speed ? `<p style="margin: 3px 0;"><strong>Speed:</strong> ${vessel.speed} knots</p>` : ''}
            ${vessel.heading ? `<p style="margin: 3px 0;"><strong>Heading:</strong> ${vessel.heading}°</p>` : ''}
          </div>
        </div>
      `)
    
    // Create the marker
    const markerInstance = new mapboxgl.Marker(container)
      .setLngLat([vessel.position.lon, vessel.position.lat])
      .setPopup(popup)
      .addTo(map)
    
    // Store the marker instance for cleanup
    markerRef.current = markerInstance;

    // Cleanup function to remove marker when unmounting
    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
      }
    }
  }, [map, vessel])
  
  return null
}