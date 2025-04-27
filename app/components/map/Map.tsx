'use client'

import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_CONFIG, validateMapboxToken } from '@/lib/map/mapbox'
import { sampleVessels } from '@/lib/data/sampleVessels'
import VesselMarker from './VesselMarker'

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Mapbox token is available
    if (!validateMapboxToken()) {
      setMapError('Mapbox API token not found. Please add it to your .env file.');
      return;
    }

    // Initialize map only once
    if (map.current) return;
    
    // Create map instance
    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;
    
    try {
      const newMap = new mapboxgl.Map({
        container: mapContainer.current!,
        style: MAPBOX_CONFIG.style,
        center: [MAPBOX_CONFIG.initialView.longitude, MAPBOX_CONFIG.initialView.latitude],
        zoom: MAPBOX_CONFIG.initialView.zoom,
        attributionControl: false,
      });

      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add scale control 
      newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
      
      newMap.on('load', () => {
        setMapLoaded(true);
      });

      map.current = newMap;
      
      // Cleanup function
      return () => {
        newMap.remove();
        map.current = null;
      };
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      setMapError('Failed to initialize map. Please check your API credentials.');
    }
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex-1 relative">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Vessel markers */}
      {mapLoaded && sampleVessels.map(vessel => (
        <VesselMarker 
          key={vessel.vesselId} 
          map={map.current} 
          vessel={vessel} 
        />
      ))}
      
      {/* Error message */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
          <div className="bg-neutral-200 dark:bg-neutral-800 p-4 rounded-md shadow-md">
            <h3 className="text-neutral-900 dark:text-neutral-100 font-medium mb-2">Map Error</h3>
            <p className="text-neutral-700 dark:text-neutral-300">{mapError}</p>
          </div>
        </div>
      )}
      
      {/* Layer toggle controls */}
      <div className="absolute top-0 left-0 m-4 bg-neutral-100/90 dark:bg-neutral-800/90 p-2 rounded-md shadow-md">
        <h3 className="text-neutral-900 dark:text-neutral-100 font-medium text-sm mb-2">Layers</h3>
        <div className="flex flex-col space-y-1">
          <label className="flex items-center text-sm text-neutral-700 dark:text-neutral-300">
            <input type="checkbox" checked={true} className="mr-2" readOnly /> 
            Vessels
          </label>
          <label className="flex items-center text-sm text-neutral-700 dark:text-neutral-300">
            <input type="checkbox" checked={false} className="mr-2" readOnly /> 
            Satellite Imagery
          </label>
        </div>
      </div>
      
      {/* Attribution */}
      <div className="absolute bottom-0 right-0 p-2 text-xs text-neutral-500">
        © <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener noreferrer" className="hover:underline">Mapbox</a> |
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenStreetMap</a>
      </div>
    </div>
  )
}