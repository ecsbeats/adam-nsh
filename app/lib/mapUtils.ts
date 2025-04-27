// app/lib/mapUtils.ts
import { isValidCell, cellToLatLng } from 'h3-js';
import mapboxgl, { Map } from 'mapbox-gl'; // Assuming mapbox-gl is installed and imported

/**
 * Represents a location which can be either coordinates or an H3 index.
 */
export type MapLocation = [number, number] | string; // [longitude, latitude] or H3Index string

/**
 * Zooms a Mapbox GL JS map to a specific location.
 *
 * @param map - The Mapbox GL JS map instance.
 * @param location - The target location, either as [lon, lat] coordinates or an H3 index string.
 * @param zoom - The desired zoom level (defaults to 15 if not provided).
 * @param options - Optional additional options for mapboxgl.CameraOptions.
 */
export function zoomToLocation(
    map: Map | null | undefined,
    location: MapLocation,
    zoom?: number,
    options?: Omit<mapboxgl.CameraOptions | mapboxgl.AnimationOptions, 'center' | 'zoom'>
): void {
    if (!map) {
        console.error('zoomToLocation: Map instance is not available.');
        return;
    }

    let center: [number, number] | null = null;
    const targetZoom = zoom ?? 15; // Default zoom if not provided

    try {
        if (typeof location === 'string') {
            // Assume H3 index string
            if (!isValidCell(location)) {
                console.error(`zoomToLocation: Invalid H3 index provided: ${location}`);
                return;
            }
            // cellToLatLng returns [latitude, longitude]
            const [lat, lon] = cellToLatLng(location);
            center = [lon, lat]; // Mapbox uses [longitude, latitude]
            console.log(`Zooming to H3 index: ${location} -> [${lon.toFixed(6)}, ${lat.toFixed(6)}] at zoom ${targetZoom}`);
        } else if (Array.isArray(location) && location.length === 2 &&
                   typeof location[0] === 'number' && typeof location[1] === 'number') {
            // Assume [longitude, latitude] array - validate basic range
             const [lon, lat] = location;
             if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                 console.error(`zoomToLocation: Invalid longitude/latitude values: [${lon}, ${lat}]`);
                 return;
             }
            center = location;
            console.log(`Zooming to Lon/Lat: [${lon.toFixed(6)}, ${lat.toFixed(6)}] at zoom ${targetZoom}`);
        } else {
            console.error('zoomToLocation: Invalid location format. Use [lon, lat] array or H3 index string.');
            return;
        }

        if (center) {
            map.flyTo({
                center: center,
                zoom: targetZoom,
                essential: true, // Ensures animation completes even if user interacts
                ...options, // Spread any additional flyTo options
            });
        }
    } catch (error) {
        console.error('zoomToLocation: Error processing location:', error);
        if (error instanceof Error && typeof location === 'string' && !isValidCell(location)) {
             console.error(`The provided string "${location}" is not a valid H3 index.`);
        }
    }
}

// --- Example Usage (within a component where you have a map instance) ---
/*
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { zoomToLocation } from '@/lib/mapUtils'; // Adjust path as needed

mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

function MyMapComponent() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [lng, setLng] = useState(-74.5);
    const [lat, setLat] = useState(40);
    const [zoom, setZoom] = useState(9);

    useEffect(() => {
        if (map.current || !mapContainer.current) return; // Initialize map only once

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [lng, lat],
            zoom: zoom
        });

        map.current.on('load', () => {
            // Example calls after map loads
             // zoomToLocation(map.current, '8a2a1072b5fffff', 12); // Zoom to H3 index
             // setTimeout(() => {
             //     zoomToLocation(map.current, [-118.2437, 34.0522], 14); // Zoom to LA (lon, lat)
             // }, 5000);
        });

        // Clean up on unmount
        return () => map.current?.remove();
    }, []); // Empty dependency array ensures this runs once on mount


    const handleZoomToH3 = () => {
        zoomToLocation(map.current, '8a2a1072b5fffff', 12);
    }

    const handleZoomToCoords = () => {
         zoomToLocation(map.current, [-118.2437, 34.0522], 14); // LA (lon, lat)
    }

    return (
        <div>
            <div ref={mapContainer} style={{ height: '500px', width: '100%' }} />
            <button onClick={handleZoomToH3}>Zoom to H3 (SF Bay)</button>
            <button onClick={handleZoomToCoords}>Zoom to Coords (LA)</button>
        </div>
    );
}

export default MyMapComponent;
*/
