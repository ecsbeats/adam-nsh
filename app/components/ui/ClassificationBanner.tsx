'use client'

type BannerPosition = 'top' | 'bottom'

export default function ClassificationBanner({ position }: { position: BannerPosition }) {
  return (
    <div className={`bg-green-900 text-neutral-50 text-center py-1 font-semibold ${position === 'top' ? 'border-b' : 'border-t'} border-green-950`}>
      UNCLASSIFIED // FOR OFFICIAL USE ONLY
    </div>
  )
}