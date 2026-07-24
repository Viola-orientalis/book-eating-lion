import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBookDetail } from '../api/books'
import { addCartItem } from '../api/cart'
import { notifyCartChanged } from '../api/cartEvents'
import { useAuth } from '../context/AuthContext'
import { isOutOfStock, isLowStock } from '../utils/stock'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [quantityError, setQuantityError] = useState('')
  const [cartError, setCartError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [imageLoadFailed, setImageLoadFailed] = useState(false)

  useEffect(() => {
    setImageLoadFailed(false)
    getBookDetail(id).then((res) => setProduct(res.data))
  }, [id])

  if (!product) return <p className="text-sm">불러오는 중...</p>

  const outOfStock = isOutOfStock(product.stock)
  const lowStock = isLowStock(product.stock)

  const handleQuantityChange = (e) => {
    const value = Math.max(1, Number(e.target.value) || 1)
    if (value > product.stock) {
      setQuantity(product.stock)
      setQuantityError(`재고(${product.stock}권)보다 많이 담을 수 없습니다.`)
    } else {
      setQuantity(value)
      setQuantityError('')
    }
  }

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    setCartError('')
    setSubmitting(true)
    try {
      await addCartItem({ bookId: product.bookId, quantity })
      notifyCartChanged()
      setAdded(true)
    } catch {
      setCartError('장바구니 담기에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    setCartError('')
    setSubmitting(true)
    try {
      await addCartItem({ bookId: product.bookId, quantity })
      notifyCartChanged()
      navigate('/cart')
    } catch {
      setCartError('장바구니 담기에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
      <div
        className="aspect-[3/4] rounded-lg flex items-center justify-center overflow-hidden"
        style={{ background: 'var(--color-line)' }}
      >
        {product.imageUrl && !imageLoadFailed ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
            onError={() => setImageLoadFailed(true)}
          />
        ) : (
          <span className="text-xs" style={{ color: 'var(--color-ink)' }}>표지 준비 중</span>
        )}
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
          {product.title}
        </h1>
        {(product.author || product.publisher) && (
          <p className="text-sm mt-1" style={{ color: 'var(--color-clay)' }}>
            {[product.author, product.publisher].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="text-xl font-semibold mt-2" style={{ color: 'var(--color-gold)' }}>
          {product.price?.toLocaleString()}원
        </p>

        <p
          className="text-sm mt-2 font-medium"
          style={{
            color: outOfStock
              ? 'var(--color-danger)'
              : lowStock
                ? 'var(--color-clay)'
                : 'var(--color-ink)',
          }}
        >
          {outOfStock ? '품절' : lowStock ? `${product.stock}권 남음` : `재고 ${product.stock}권`}
        </p>

        <p className="text-sm mt-4 leading-relaxed" style={{ color: 'var(--color-ink)' }}>
          {product.description}
        </p>

        <div className="flex items-center gap-3 mt-6">
          <label className="text-sm">수량</label>
          <input
            type="number"
            min={1}
            max={product.stock}
            value={quantity}
            onChange={handleQuantityChange}
            disabled={outOfStock}
            className="w-16 border rounded px-2 py-1 text-sm disabled:opacity-50"
            style={{ borderColor: 'var(--color-line)' }}
          />
        </div>
        {quantityError && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>
            {quantityError}
          </p>
        )}

        {!isLoggedIn && (
          <p className="text-xs mt-3" style={{ color: 'var(--color-clay)' }}>
            로그인 후 장바구니를 이용할 수 있어요
          </p>
        )}
        {cartError && (
          <p className="text-xs mt-3" style={{ color: 'var(--color-danger)' }}>
            {cartError}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock || submitting}
            className="flex-1 py-2.5 rounded border font-medium disabled:opacity-50"
            style={{ borderColor: 'var(--color-clay)', color: 'var(--color-clay)' }}
          >
            {outOfStock
              ? '품절'
              : submitting
                ? '담는 중...'
                : added
                  ? '담았습니다 ✓'
                  : '장바구니 담기'}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={outOfStock || submitting}
            className="flex-1 py-2.5 rounded text-white font-medium disabled:opacity-50"
            style={{ background: 'var(--color-ink)' }}
          >
            {outOfStock ? '품절' : submitting ? '처리 중...' : '바로 구매'}
          </button>
        </div>
      </div>
    </div>
  )
}
