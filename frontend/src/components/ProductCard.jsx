import { Link } from 'react-router-dom'
import { isOutOfStock, isLowStock } from '../utils/stock'

export default function ProductCard({ product }) {
  const outOfStock = isOutOfStock(product.stock)
  const lowStock = isLowStock(product.stock)

  return (
    <Link
      to={`/products/${product.bookId}`}
      className="relative block rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
      style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
    >
      <span className="bookmark-tag" />

      {(outOfStock || lowStock) && (
        <span
          className="absolute top-2 left-2 z-10 text-xs font-semibold px-2 py-1 rounded text-white"
          style={{ background: outOfStock ? 'var(--color-danger)' : 'var(--color-clay)' }}
        >
          {outOfStock ? '품절' : '품절임박'}
        </span>
      )}

      <div className="aspect-[3/4] flex items-center justify-center" style={{ background: 'var(--color-line)' }}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover"
            style={outOfStock ? { opacity: 0.5 } : undefined}
          />
        ) : (
          <span className="text-xs" style={{ color: 'var(--color-ink)' }}>표지 준비 중</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-display font-bold text-sm truncate" style={{ color: 'var(--color-ink)' }}>
          {product.title}
        </h3>
        <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--color-gold)' }}>
          {product.price?.toLocaleString()}원
        </p>
      </div>
    </Link>
  )
}
