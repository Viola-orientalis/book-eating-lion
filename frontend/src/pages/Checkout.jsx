import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCart, clearCartItems } from '../api/cart'
import { notifyCartChanged } from '../api/cartEvents'
import { createOrder } from '../api/orders'
import { getMyCards, issueCard } from '../api/cards'
import { requestPayment } from '../api/payments'
import { getProducts } from '../api/products'

export default function Checkout() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [cartLoading, setCartLoading] = useState(true)
  const [cards, setCards] = useState([])
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [status, setStatus] = useState('idle') // idle | processing | approved | rejected
  const [message, setMessage] = useState('')
  const [issuingCard, setIssuingCard] = useState(false)

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  useEffect(() => {
    getCart()
      .then((res) => setItems(res.data.items))
      .catch(() => setItems([]))
      .finally(() => setCartLoading(false))

    getMyCards()
      .then((res) => {
        setCards(res.data)
        if (res.data.length > 0) setSelectedCardId(res.data[0].id)
      })
      .catch(() => setCards([]))
  }, [])

  const handleIssueCard = async () => {
    setIssuingCard(true)
    try {
      const res = await issueCard()
      setCards((prev) => [...prev, res.data])
      setSelectedCardId(res.data.id)
    } catch {
      setMessage('카드 발급에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIssuingCard(false)
    }
  }

  const handlePay = async () => {
    if (!selectedCardId) {
      setMessage('결제할 카드를 먼저 선택하거나 발급해주세요.')
      return
    }
    setStatus('processing')
    setMessage('')
    try {
      // 장바구니 페이지 확인 이후 시간차로 판매 종료됐을 수 있으니 결제 직전 한 번 더 대조
      const productsRes = await getProducts()
      const availableIds = new Set(productsRes.data.map((p) => p.id))
      const deletedItem = items.find((i) => !availableIds.has(i.productId))
      if (deletedItem) {
        setStatus('rejected')
        setMessage(
          `${deletedItem.title}은(는) 판매가 종료되어 결제를 진행할 수 없습니다. 장바구니에서 확인해주세요.`
        )
        return
      }

      // REQ-04: 주문 생성 (PENDING)
      const orderRes = await createOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
      const orderId = orderRes.data.id

      // REQ-06: 결제 검증 및 승인/거절 (카드 존재/상태/한도 순차 검증)
      const paymentRes = await requestPayment({ orderId, cardId: selectedCardId })

      if (paymentRes.data.status === 'APPROVED') {
        setStatus('approved')
        await clearCartItems(items)
        notifyCartChanged()
      } else {
        setStatus('rejected')
        setMessage(paymentRes.data.rejectReason || '결제가 거절되었습니다.')
      }
    } catch (err) {
      setStatus('rejected')
      setMessage(err.response?.data?.message || '결제 처리 중 오류가 발생했습니다.')
    }
  }

  if (cartLoading) {
    return <p className="text-sm">불러오는 중...</p>
  }

  if (status === 'approved') {
    return (
      <div className="text-center py-20">
        <p className="text-2xl font-display font-bold mb-2" style={{ color: 'var(--color-forest)' }}>
          결제가 완료되었습니다
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--color-clay)' }}>
          명세서는 결제내역에서 확인하실 수 있어요
        </p>
        <button
          onClick={() => navigate('/payments')}
          className="px-4 py-2 rounded text-white"
          style={{ background: 'var(--color-ink)' }}
        >
          결제내역 보기
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--color-ink)' }}>
        주문/결제
      </h1>

      <section className="mb-6">
        <h2 className="text-sm font-medium mb-2">주문 상품</h2>
        <div className="border rounded px-4 py-3" style={{ borderColor: 'var(--color-line)' }}>
          {items.map((i) => (
            <div key={i.id} className="flex justify-between text-sm py-1">
              <span>{i.title} × {i.quantity}</span>
              <span>{(i.price * i.quantity).toLocaleString()}원</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-line)' }}>
            <span>총액</span>
            <span style={{ color: 'var(--color-gold)' }}>{totalPrice.toLocaleString()}원</span>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-medium mb-2">결제 카드</h2>
        {cards.length === 0 ? (
          <button
            onClick={handleIssueCard}
            disabled={issuingCard}
            className="w-full py-2.5 rounded border font-medium disabled:opacity-50"
            style={{ borderColor: 'var(--color-clay)', color: 'var(--color-clay)' }}
          >
            {issuingCard ? '발급 중...' : '가상 카드 발급받기'}
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            {cards.map((card) => (
              <label
                key={card.id}
                className="flex items-center gap-3 border rounded px-4 py-2.5 cursor-pointer text-sm"
                style={{
                  borderColor: selectedCardId === card.id ? 'var(--color-clay)' : 'var(--color-line)',
                }}
              >
                <input
                  type="radio"
                  name="card"
                  checked={selectedCardId === card.id}
                  onChange={() => setSelectedCardId(card.id)}
                />
                <span>{card.maskedCardNumber}</span>
                <span className="ml-auto" style={{ color: 'var(--color-clay)' }}>
                  한도 {card.remainingLimit?.toLocaleString()}원
                </span>
              </label>
            ))}

            <button
              onClick={handleIssueCard}
              disabled={issuingCard}
              className="text-sm underline self-start mt-1 disabled:opacity-50"
              style={{ color: 'var(--color-clay)' }}
            >
              {issuingCard ? '발급 중...' : '카드 추가 발급'}
            </button>
          </div>
        )}
      </section>

      {message && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
          {message}
        </p>
      )}

      <button
        onClick={handlePay}
        disabled={status === 'processing'}
        className="w-full py-3 rounded text-white font-medium disabled:opacity-50"
        style={{ background: 'var(--color-ink)' }}
      >
        {status === 'processing' ? '결제 처리 중...' : `${totalPrice.toLocaleString()}원 결제하기`}
      </button>
    </div>
  )
}
