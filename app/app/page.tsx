import Map from '@/components/map/Map'
import Chat from '@/components/chat/Chat'
import ClassificationBanner from '@/components/ui/ClassificationBanner'

export default function Home() {
  return (
    <main className="flex flex-col h-screen">
      <ClassificationBanner position="top" />
      <div className="flex flex-1 overflow-hidden">
        <Map />
        <Chat />
      </div>
      <ClassificationBanner position="bottom" />
    </main>
  )
}