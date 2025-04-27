'use client'; // Needed for useRef and useCallback

import { useRef, useCallback } from 'react'; // Import hooks
import Map, { MapHandle } from '@/components/map/Map'; // Import MapHandle
import Chat, { ZoomRequestCallback } from '@/components/chat/Chat'; // Import ZoomRequestCallback
import ClassificationBanner from '@/components/ui/ClassificationBanner';

export default function Home() {
  // Create a ref for the Map component
  const mapRef = useRef<MapHandle>(null);

  // Define the callback function for zoom requests from the Chat component
  const handleZoomRequest: ZoomRequestCallback = useCallback(async (location, level) => {
    console.log(`Page: Handling zoom request for ${location} at level ${level}`);
    if (mapRef.current) {
      try {
        const description = await mapRef.current.triggerZoomAndGetDescription(location, level);
        console.log("Page: Received description from map:", description);
        return description; // Return the description (or null/error string)
      } catch (error) {
        console.error("Page: Error calling map zoom function:", error);
        return `Error communicating with map: ${(error as Error).message}`;
      }
    } else {
      console.error("Page: Map ref is not available.");
      return "Error: Map component is not accessible.";
    }
  }, []); // Empty dependency array: the function doesn't depend on props/state

  return (
    <main className="flex flex-col h-screen">
      <ClassificationBanner position="top" />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative min-w-0 dark">
          {/* Pass the ref to the Map component */}
          <Map ref={mapRef} />
        </div>
        {/* Pass the callback to the Chat component */}
        <Chat onZoomRequest={handleZoomRequest} />
      </div>
      <ClassificationBanner position="bottom" />
    </main>
  );
}