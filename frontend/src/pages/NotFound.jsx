import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <p className="font-display text-4xl font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
        404
      </p>
      <p className="text-sm mb-6" style={{ color: 'var(--color-clay)' }}>
        페이지를 찾을 수 없습니다
      </p>
      <Link to="/" className="underline" style={{ color: 'var(--color-gold)' }}>
        도서 둘러보기
      </Link>
    </div>
  )
}
