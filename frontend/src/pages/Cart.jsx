import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart, updateCartItem, removeCartItem } from '../api/cart'
import { getBooks } from '../api/books'
import { notifyCartChanged } from '../api/cartEvents'

export default function Cart() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [stockMap, setStockMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [orderError, setOrderError] = useState('')
  const [checking, setChecking] = useState(false)
  const [busyItemId, setBusyItemId] = useState(null)
  const [removedNotice, setRemovedNotice] = useState('')

  useEffect(() => {
    Promise.all([getCart(), getBooks({ size: 1000 })])
      .then(([cartRes, booksRes]) => {
        const map = {}
        booksRes.data.content.forEach((b) => {
          map[b.bookId] = b.stock
        })
        setStockMap(map)

        // 서버가 판매 종료 도서를 걸러주지 않으므로, 프론트에서 최신 도서 목록과 대조해
        // 더 이상 존재하지 않는 도서는 자동으로 제거하고 안내한다.
        const availableIds = new Set(booksRes.data.content.map((b) => b.bookId))
        const staleItems = cartRes.data.filter((item) => !availableIds.has(item.bookId))
        const freshItems = cartRes.data.filter((item) => availableIds.has(item.bookId))
        setItems(freshItems)

        if (staleItems.length > 0) {
          staleItems.forEach((item) => removeCartItem(item.id))
          const titles = staleItems.map((item) => item.title).join(', ')
          setRemovedNotice(`판매 종료된 도서가 장바구니에서 제거되었습니다: ${titles}`)
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const handleQuantityChange = async (item, nextQuantity) => {
    if (nextQuantity < 1) return
    setBusyItemId(item.id)
    try {
      await updateCartItem(item.id, { quantity: nextQuantity })
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: nextQuantity } : i))
      )
      notifyCartChanged()
    } finally {
      setBusyItemId(null)
    }
  }

  const handleRemove = async (item) => {
    setBusyItemId(item.id)
    try {
      await removeCartItem(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      notifyCartChanged()
    } finally {
      setBusyItemId(null)
    }
  }

  const handleCheckout = async () => {
    setOrderError('')
    setChecking(true)
    try {
      const res = await getBooks({ size: 1000 })
      const latestStock = {}
      res.data.content.forEach((b) => {
        latestStock[b.bookId] = b.stock
      })
      setStockMap(latestStock)

      const insufficientItem = items.find(
        (item) => item.quantity > (latestStock[item.bookId] ?? 0)
      )
      if (insufficientItem) {
        setOrderError(
          `${insufficientItem.title}의 재고가 부족합니다. (재고 ${latestStock[insufficientItem.bookId] ?? 0}권)`
        )
        return
      }
      navigate('/checkout')
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return <p className="text-sm">불러오는 중...</p>
  }

  return (
    <div>
      {removedNotice && (
        <p
          className="text-sm mb-4 border rounded px-4 py-3"
          style={{
            borderColor: 'var(--color-clay)',
            color: 'var(--color-clay)',
            background: 'var(--color-paper-soft)',
          }}
        >
          {removedNotice}
        </p>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="mb-4" style={{ color: 'var(--color-clay)' }}>
            장바구니가 비어있습니다
          </p>
          <Link to="/" className="underline" style={{ color: 'var(--color-gold)' }}>
            도서 둘러보기
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--color-ink)' }}>
            장바구니
          </h1>

          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const stock = stockMap[item.bookId]
              const overStock = stock !== undefined && item.quantity > stock
              const busy = busyItemId === item.id
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between border rounded px-4 py-3"
                  style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
                >
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-ink)' }}>{item.title}</p>
                    <p className="text-sm" style={{ color: 'var(--color-clay)' }}>
                      {item.price.toLocaleString()}원
                    </p>
                    {stock !== undefined && (
                      <p
                        className="text-xs mt-1"
                        style={{ color: overStock ? 'var(--color-danger)' : 'var(--color-clay)' }}
                      >
                        재고 {stock}권 중 {item.quantity}개 담음
                        {overStock && ' · 재고보다 많이 담았습니다'}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        disabled={busy || item.quantity <= 1}
                        className="w-7 h-7 rounded border text-sm disabled:opacity-50"
                        style={{ borderColor: 'var(--color-line)' }}
                      >
                        −
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        disabled={busy}
                        className="w-7 h-7 rounded border text-sm disabled:opacity-50"
                        style={{ borderColor: 'var(--color-line)' }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(item)}
                      disabled={busy}
                      className="text-sm underline disabled:opacity-50"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      {busy ? '처리 중...' : '삭제'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-8 border-t pt-4" style={{ borderColor: 'var(--color-line)' }}>
            <span className="font-medium">총 결제 금액</span>
            <span className="text-xl font-bold" style={{ color: 'var(--color-gold)' }}>
              {totalPrice.toLocaleString()}원
            </span>
          </div>

          {orderError && (
            <p className="text-sm mt-4" style={{ color: 'var(--color-danger)' }}>
              {orderError}
            </p>
          )}

          <button
            onClick={handleCheckout}
            disabled={checking}
            className="w-full mt-6 py-3 rounded text-white font-medium disabled:opacity-50"
            style={{ background: 'var(--color-ink)' }}
          >
            {checking ? '확인 중...' : '주문하기'}
          </button>
        </>
      )}
    </div>
  )
}
