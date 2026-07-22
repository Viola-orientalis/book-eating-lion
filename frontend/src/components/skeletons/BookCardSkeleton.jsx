export default function BookCardSkeleton() {
  return (
    <div
      className="relative block rounded-lg overflow-hidden border animate-pulse"
      style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
    >
      <div className="aspect-[3/4]" style={{ background: 'var(--color-line)' }} />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 rounded" style={{ background: 'var(--color-line)', width: '80%' }} />
        <div className="h-4 rounded" style={{ background: 'var(--color-line)', width: '40%' }} />
      </div>
    </div>
  )
}
