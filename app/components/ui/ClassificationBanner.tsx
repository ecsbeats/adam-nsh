type BannerPosition = 'top' | 'bottom'

export default function ClassificationBanner({ position }: { position: BannerPosition }) {
  return (
    <div className={`bg-blue-900 text-white text-center py-1 font-bold ${position === 'top' ? 'border-b' : 'border-t'} border-blue-700`}>
      UNCLASSIFIED // ADAM MARITIME INTELLIGENCE SYSTEM
    </div>
  )
}