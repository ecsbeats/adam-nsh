'use client'

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_CONFIG, validateMapboxToken } from '@/lib/map/mapbox'
import { fetchVessels } from '@/lib/api/vessels'
import { AISData } from '@/lib/adapters/types'
import VesselMarker from './VesselMarker'
import MapStyleIndicator from './MapStyleIndicator'

export interface MapSummaryData {
  count: number;
  center?: { lng: number; lat: number };
  zoom?: number;
  bounds?: mapboxgl.LngLatBounds;
  screenshotDataURL?: string;
  biggestShip?: AISData | null;
  fastestShip?: AISData | null;
  smallestShip?: AISData | null;
  error?: string;
}

export interface MapHandle {
  triggerZoomAndGetDescription: (location: string, level: number) => Promise<string | null>;
  getMapSummaryData: () => Promise<MapSummaryData>;
}

const Map = forwardRef<MapHandle>((props, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [vessels, setVessels] = useState<AISData[]>([])
  const [loading, setLoading] = useState(true)
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'satelliteStreets'>('dark')
  const [showVessels, setShowVessels] = useState(true)

  useImperativeHandle(ref, () => ({
    triggerZoomAndGetDescription: async (location: string, level: number): Promise<string | null> => {
      console.log(`Map Handle: Received zoom request for '${location}' at level ${level}`);
      if (!map.current || !mapLoaded) {
        console.error("Map Handle: Attempted zoom before map was ready.");
        return Promise.resolve("Error: Map is not ready.");
      }

      let coordinates: mapboxgl.LngLatLike | null = null;
      const mapboxToken = MAPBOX_CONFIG.accessToken; // Ensure this token is valid

      // --- Geocoding Step --- 
      try {
        console.log(`Map Handle: Geocoding location: ${location}`);
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxToken}&limit=1`;
        const response = await fetch(geocodeUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Mapbox Geocoding API error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          coordinates = data.features[0].center as mapboxgl.LngLatLike; // [longitude, latitude]
          console.log(`Map Handle: Geocoded coordinates: ${JSON.stringify(coordinates)}`);
        } else {
          console.warn(`Map Handle: Geocoding failed for "${location}", location not found.`);
          return `Could not find coordinates for location: "${location}".`; // Return specific error
        }
      } catch (error) {
        console.error("Map Handle: Geocoding fetch error:", error);
        return `Error finding coordinates for "${location}": ${(error as Error).message}`;
      }
      // --- End Geocoding Step ---

      // --- FlyTo and Description Generation Step ---
      if (coordinates) {
        try {
          console.log(`Map Handle: Flying to ${JSON.stringify(coordinates)} at zoom ${level}`);
          map.current.flyTo({
            center: coordinates, // Use the geocoded coordinates
            zoom: level,
            essential: true // This animation is considered essential with respect to prefers-reduced-motion
          });
          
          // Simulate waiting for map to settle and generating description
          await new Promise(resolve => map.current?.once('moveend', resolve)); // Wait for flyTo animation
          await new Promise(resolve => setTimeout(resolve, 500)); // Extra buffer

          console.log("Map Handle: Generating description after move...");
          // Simulate description generation (existing logic)
          const currentBounds = map.current.getBounds();
          const currentCenter = map.current.getCenter();
          const currentZoom = map.current.getZoom();
          const mapStyle = map.current.getStyle().name || 'default';

          const visibleVessels = vessels.filter(v => 
              v.position && 
              v.position.lat != null && 
              v.position.lon != null && 
              currentBounds && // Check if currentBounds is not null
              currentBounds.contains([v.position.lon, v.position.lat])
          ).length;

          const description = `Map zoomed to ${location} (center: ${currentCenter.lng.toFixed(4)}, ${currentCenter.lat.toFixed(4)}, zoom: ${currentZoom.toFixed(1)}). ${visibleVessels > 0 ? `${visibleVessels} vessel(s) visible.` : 'No vessels currently visible in this view.'} Map style is ${mapStyle}.`;
          console.log("Map Handle: Generated description:", description);
          return description;

        } catch (flyToError) {
          console.error("Error during map flyTo:", flyToError);
          return `Error performing map zoom: ${(flyToError as Error).message}`;
        }
      } else {
         // This path should theoretically not be reached if geocoding error handling is correct
         console.error("Map Handle: Coordinates were null after geocoding attempt.");
         return "Error: Could not determine coordinates for zooming after geocoding.";
      }
    },
    getMapSummaryData: async (): Promise<MapSummaryData> => {
      console.log("Map Handle: getMapSummaryData called");
      if (!map.current || !mapLoaded) {
        console.error("Map Handle: getMapSummaryData called before map ready.");
        return { count: 0, error: "Map not ready" };
      }

      try {
        const currentMap = map.current;
        const currentBounds = currentMap.getBounds();
        const currentCenter = currentMap.getCenter();
        const currentZoom = currentMap.getZoom();

        // Filter for visible vessels (add null check for bounds)
        const visibleVessels = currentBounds 
          ? vessels.filter(v => 
              v.position && 
              v.position.lat != null && 
              v.position.lon != null && 
              currentBounds.contains([v.position.lon, v.position.lat])
            )
          : []; // Empty array if bounds are null
        const count = visibleVessels.length;

        let biggestShip: AISData | null = null;
        let fastestShip: AISData | null = null;
        let smallestShip: AISData | null = null;

        if (count > 0) {
          // Calculate area for size comparison (handle missing Length/Width)
          const getArea = (v: AISData) => (v.Length ?? 0) * (v.Width ?? 0);
          
          visibleVessels.forEach(v => {
            // Biggest
            if (!biggestShip || getArea(v) > getArea(biggestShip)) {
              biggestShip = v;
            }
            // Smallest (only if Length/Width are present)
            if (v.Length && v.Width && (!smallestShip || getArea(v) < getArea(smallestShip))) {
               smallestShip = v;
            }
            // Fastest (handle missing speed)
            if (v.speed != null && (!fastestShip || v.speed > (fastestShip.speed ?? -1))) {
              fastestShip = v;
            }
          });
        }

        // Generate screenshot (only if needed and supported)
        let screenshotDataURL: string | undefined = undefined;
        try {
           // Preserve drawing buffer is needed for toDataURL to work reliably *after* render.
           // This needs to be set during map initialization.
           // If not set, this might return a blank/black image.
          screenshotDataURL = currentMap.getCanvas().toDataURL();
          console.log("Map Handle: Screenshot generated (length approx:", screenshotDataURL?.length, ")");
        } catch (e) {
           console.error("Map Handle: Error generating screenshot", e);
           // Might fail due to CORS/tainted canvas if using external resources in style
           screenshotDataURL = undefined; // Ensure it's undefined on error
        }

        const summaryData: MapSummaryData = {
          count,
          center: currentCenter ?? undefined, // Handle potential null center
          zoom: currentZoom ?? undefined, // Handle potential null zoom
          bounds: currentBounds ?? undefined, // Handle potential null bounds
          screenshotDataURL,
          biggestShip,
          fastestShip,
          smallestShip
        };
        console.log("Map Handle: Generated summary data:", summaryData);
        return summaryData;

      } catch (error) {
        console.error("Map Handle: Error generating map summary:", error);
        return { count: 0, error: `Failed to generate summary: ${(error as Error).message}` };
      }
    }
  }));

  useEffect(() => {
    async function loadVessels() {
      try {
        setLoading(true);
        // Fetch raw data (assuming it matches backend structure)
        const rawVesselData: any[] = await fetchVessels(); // Use any[] temporarily
        
        // Map raw data to the clean AISData structure
        const mappedVessels: AISData[] = rawVesselData.map(raw => ({
          MMSI: raw.MMSI,
          uniqueKey: `${raw.MMSI}-${raw.BaseDateTime}`, // Generate key
          timestamp: raw.BaseDateTime,
          position: {
            lat: raw.LAT,
            lon: raw.LON
          },
          heading: raw.Heading,
          speed: raw.SOG, // Map SOG to speed
          vesselInfo: {
            name: raw.VesselName,
            callSign: raw.CallSign,
            // TODO: Map VesselType number to a meaningful string if needed
            type: raw.VesselType !== undefined ? String(raw.VesselType) : undefined, 
            imo: raw.IMO
          },
          // Include other fields directly if needed
          Status: raw.Status,
          Length: raw.Length,
          Width: raw.Width,
          Draft: raw.Draft,
          COG: raw.COG,
          TransceiverClass: raw.TransceiverClass
        }));

        setVessels(mappedVessels); // Set state with the processed data
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

  useEffect(() => {
    if (!validateMapboxToken()) {
      setMapError('Mapbox public token not found. Please add it to your .env file.');
      return;
    }
    if (map.current) return; 
    if (!mapContainer.current) {
        console.error('Map container ref is not available before init');
        setMapError('Map container element not found.');
        return;
    }

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken; 
    
    try {
      const newMap = new mapboxgl.Map({
        container: mapContainer.current!,
        style: MAPBOX_CONFIG.styles.dark,
        center: [MAPBOX_CONFIG.initialView.longitude, MAPBOX_CONFIG.initialView.latitude],
        zoom: MAPBOX_CONFIG.initialView.zoom,
        attributionControl: false,
        preserveDrawingBuffer: true
      });

      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
      
      newMap.on('load', () => {
        console.log('Map loaded event triggered');
        setMapLoaded(true);
      });

      map.current = newMap;
      
      return () => {
        console.log('Cleaning up map');
        newMap.remove();
        map.current = null;
        setMapLoaded(false); 
      };
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      setMapError('Failed to initialize map. Please check your API credentials.');
    }
  }, []); 

  useEffect(() => {
    if (map.current && mapLoaded) {
      const currentCenter = map.current.getCenter();
      const currentZoom = map.current.getZoom();
      const currentBearing = map.current.getBearing();
      const currentPitch = map.current.getPitch();
      
      const styleURL = MAPBOX_CONFIG.styles[mapStyle];
      console.log(`Changing map style to: ${mapStyle} (${styleURL})`);
      map.current.setStyle(styleURL);
      
      const onStyleLoad = () => {
        if (map.current) {
          console.log('Map style loaded, restoring view state');
          map.current.setCenter(currentCenter);
          map.current.setZoom(currentZoom);
          map.current.setBearing(currentBearing);
          map.current.setPitch(currentPitch);
        }
      };
      
      map.current.once('style.load', onStyleLoad);

      return () => {
          if (map.current) {
              map.current.off('style.load', onStyleLoad);
          }
      };
    }
  }, [mapStyle, mapLoaded]);

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
    <div className="relative h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {mapLoaded && showVessels && vessels.map(vessel => {
        return (
          <VesselMarker
            key={vessel.uniqueKey}
            map={map.current}
            vessel={vessel}
          />
        );
      })}
      
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 z-10">
          <div className="bg-neutral-200 dark:bg-neutral-800 p-4 shadow-md">
            <h3 className="text-neutral-900 dark:text-neutral-100 font-medium mb-2">Map Error</h3>
            <p className="text-neutral-700 dark:text-neutral-300">{mapError}</p>
          </div>
        </div>
      )}
      
      <div className="absolute top-0 left-0 m-4 bg-neutral-100/90 dark:bg-neutral-800/90 p-3 shadow-md z-10">
        <h3 className="text-neutral-900 dark:text-neutral-100 font-medium text-sm mb-3">Map Layers</h3>
        
        <div className="mb-3">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1.5">Map Style</p>
          <div className="flex space-x-2">
            {/* Fix: Manually create buttons as styleLabels does not exist */}
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

        <div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1.5">Data Layers</p>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showVessels}
              onChange={(e) => setShowVessels(e.target.checked)}
              className="form-checkbox h-3.5 w-3.5 text-blue-600 bg-neutral-300 border-neutral-400 dark:bg-neutral-600 dark:border-neutral-500 focus:ring-blue-500"
            />
            <span className="text-xs text-neutral-800 dark:text-neutral-200">Vessel Tracks</span>
          </label>
        </div>
      </div>

      {/* Map Style Indicator */}
      {/* Fix: Pass 'style' prop instead of 'currentStyle' */} 
      {mapLoaded && <MapStyleIndicator style={mapStyle} />}
    </div>
  )
});

Map.displayName = 'Map';

export default Map;
