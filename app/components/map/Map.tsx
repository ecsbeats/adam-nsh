'use client'

import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_CONFIG, validateMapboxToken } from '@/lib/map/mapbox'
import { fetchVessels } from '@/lib/api/vessels'
import { AISData } from '@/lib/adapters/types'
import VesselMarker from './VesselMarker'
import MapStyleIndicator from './MapStyleIndicator'

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [vessels, setVessels] = useState<AISData[]>([])
  const [loading, setLoading] = useState(true)
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'satelliteStreets'>('dark')
  const [showVessels, setShowVessels] = useState(true)

  // Fetch vessel data from secure API
  useEffect(() => {
    async function loadVessels() {
      try {
        setLoading(true);
        const vesselData = await fetchVessels();
        setVessels(vesselData);
      } catch (error) {
        console.error('Failed to load vessel data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (mapLoaded) {
      loadVessels();
    }
  }, [mapLoaded]);

  // Initialize the map
  useEffect(() => {
    // Check if Mapbox token is available
    if (!validateMapboxToken()) {
      setMapError('Mapbox public token not found. Please add it to your .env file.');
      return;
    }

    // Initialize map only once
    if (map.current) return;
    
    // Add logging here
    if (mapContainer.current) {
      console.log('Map container dimensions before init:', 
        mapContainer.current.offsetWidth, 
        mapContainer.current.offsetHeight
      );
    } else {
      console.error('Map container ref is not available before init');
      setMapError('Map container element not found.');
      return;
    }
    // End logging

    // Create map instance - using the public token only
    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken; 
    
    try {
      const newMap = new mapboxgl.Map({
        container: mapContainer.current!,
        style: MAPBOX_CONFIG.styles.dark, // Start with dark style
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

  // Effect to change map style when mapStyle state changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      // Store current position and zoom before changing style
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();
      const currentBearing = map.current.getBearing();
      const currentPitch = map.current.getPitch();
      
      // Change the map style
      const styleURL = MAPBOX_CONFIG.styles[mapStyle];
      map.current.setStyle(styleURL);
      
      // Listen for style load event to restore position
      const onStyleLoad = () => {
        if (map.current) {
          map.current.setCenter(currentCenter);
          map.current.setZoom(currentZoom);
          map.current.setBearing(currentBearing);
          map.current.setPitch(currentPitch);
        }
      };
      
      map.current.once('style.load', onStyleLoad);
    }
  }, [mapStyle, mapLoaded]);

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
    // Remove flex-1, keep relative for positioning context
    <div className="relative h-full">
      {/* Use w-full h-full to ensure explicit dimensions */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Vessel markers - using vessels from API */}
      {mapLoaded && showVessels && vessels.map(vessel => (
        <VesselMarker 
          key={vessel.vesselId} 
          map={map.current} 
          vessel={vessel} 
        />
      ))}
      
      {/* Error message */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
          <div className="bg-neutral-200 dark:bg-neutral-800 p-4 shadow-md">
            <h3 className="text-neutral-900 dark:text-neutral-100 font-medium mb-2">Map Error</h3>
            <p className="text-neutral-700 dark:text-neutral-300">{mapError}</p>
          </div>
        </div>
      )}
      
      {/* Layer toggle controls */}
      <div className="absolute top-0 left-0 m-4 bg-neutral-100/90 dark:bg-neutral-800/90 p-3 shadow-md">
        <h3 className="text-neutral-900 dark:text-neutral-100 font-medium text-sm mb-3">Map Layers</h3>
        
        {/* Style selection */}
        <div className="mb-3">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1.5">Map Style</p>
          <div className="flex space-x-2">
            <button 
              onClick={() => setMapStyle('dark')}
              className={`px-2 py-1 text-xs ${
                mapStyle === 'dark' 
                  ? 'bg-neutral-800 text-neutral-100' 
                  : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
              }`}
            >
              Standard
            </button>
            <button 
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-1 text-xs ${
                mapStyle === 'satellite' 
                  ? 'bg-neutral-800 text-neutral-100' 
                  : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
              }`}
            >
              Satellite
            </button>
            <button 
              onClick={() => setMapStyle('satelliteStreets')}
              className={`px-2 py-1 text-xs ${
                mapStyle === 'satelliteStreets' 
                  ? 'bg-neutral-800 text-neutral-100' 
                  : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
              }`}
            >
              Satellite+
            </button>
          </div>
        </div>
        
        {/* Layer toggles */}
        <div className="mb-1">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1.5">Data Layers</p>
          <div className="flex flex-col space-y-1.5">
            <label className="flex items-center text-sm text-neutral-700 dark:text-neutral-300">
              <input 
                type="checkbox" 
                checked={showVessels} 
                onChange={() => setShowVessels(!showVessels)}
                className="mr-2" 
              /> 
              Vessels {loading && (
                <span className="ml-2 inline-flex">
                  <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse"></span>
                  <span className="ml-1 w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse delay-75"></span>
                  <span className="ml-1 w-1.5 h-1.5 bg-neutral-500 rounded-full animate-pulse delay-150"></span>
                </span>
              )}
            </label>
          </div>
        </div>
        
        {/* Vessel count */}
        {!loading && vessels.length > 0 && (
          <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500">
            {vessels.length} vessels active
            {!showVessels && (
              <span className="block text-neutral-400 italic mt-1">(currently hidden)</span>
            )}
          </div>
        )}
      </div>
      
      {/* Map style indicator */}
      {mapLoaded && <MapStyleIndicator style={mapStyle} />}
      
      {/* Attribution */}
      <div className="absolute bottom-0 right-0 p-2 text-xs text-neutral-500">
        &copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener noreferrer" className="hover:underline">Mapbox</a> |
        &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenStreetMap</a>
      </div>
    </div>
  )
}
