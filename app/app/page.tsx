import Map from '@/components/map/Map'
import Chat from '@/components/chat/Chat'
import ClassificationBanner from '@/components/ui/ClassificationBanner'

export default function Home() {
  return (
    <main className="flex flex-col h-screen">
      <ClassificationBanner position="top" />
      {/* Apply flex, flex-1, and overflow-hidden to the container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Add min-w-0 here to allow the Map component to shrink if needed */}
        <div className="flex-1 relative min-w-0">
          <Map />
        </div>
        <Chat />
      </div>
      <ClassificationBanner position="bottom" />
    </main>
  )
}