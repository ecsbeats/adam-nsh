'use client'

type BannerPosition = 'top' | 'bottom'

export default function ClassificationBanner({ position }: { position: BannerPosition }) {
  return (
    <div className={`bg-neutral-800 text-neutral-50 text-center py-1 font-bold ${position === 'top' ? 'border-b' : 'border-t'} border-neutral-700`}>
      UNCLASSIFIED // ADAM MARITIME INTELLIGENCE SYSTEM
    </div>
  )
}