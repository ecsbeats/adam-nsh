'use client'

type BannerPosition = 'top' | 'bottom'

export default function ClassificationBanner({ position }: { position: BannerPosition }) {
  return (
    <div className={`bg-green-900 text-neutral-50 text-center py-0.5 font-semibold ${position === 'top' ? 'border-b' : 'border-t'} border-green-800`}>
      UNCLASSIFIED // FOR OFFICIAL USE ONLY
    </div>
  )
}