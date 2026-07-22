export default function ListSkeleton({ rows = 3 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="border rounded px-4 py-3 flex items-center justify-between animate-pulse"
          style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
        >
          <div className="flex flex-col gap-2">
            <div className="h-4 rounded" style={{ background: 'var(--color-line)', width: '160px' }} />
            <div className="h-3 rounded" style={{ background: 'var(--color-line)', width: '100px' }} />
          </div>
          <div className="h-4 rounded" style={{ background: 'var(--color-line)', width: '48px' }} />
        </div>
      ))}
    </div>
  )
}
