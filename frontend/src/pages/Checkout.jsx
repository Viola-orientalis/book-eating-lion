import { useEffect, useState } from 'react'
import { getCart, clearCartItems } from '../api/cart'
import { notifyCartChanged } from '../api/cartEvents'
import { createOrder, getMyOrders } from '../api/orders'
import { getMyCards, issueCard } from '../api/cards'
import {
  requestPayment,
  requestKakaoPayReady,
  saveKakaoPaySession,
  clearKakaoPaySession,
} from '../api/payments'
import { getBooks } from '../api/books'
import CardLimitForm from '../components/CardLimitForm'
import PaymentSuccessScreen from '../components/PaymentSuccessScreen'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'

export default function Checkout() {
  const { showError } = useToast()

  const [items, setItems] = useState([])
  const [cartLoading, setCartLoading] = useState(true)
  const [cards, setCards] = useState([])
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('CARD') // 'CARD' | 'KAKAOPAY'
  // idle | processing | kakao_awaiting_confirm | approved | declined
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [issuingCard, setIssuingCard] = useState(false)
  const [showLimitForm, setShowLimitForm] = useState(false)
  const [kakaoOrderId, setKakaoOrderId] = useState(null)
  const [checkingKakaoStatus, setCheckingKakaoStatus] = useState(false)
  const [paymentResult, setPaymentResult] = useState(null)

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  useEffect(() => {
    getCart()
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setCartLoading(false))

    getMyCards()
      .then((res) => {
        setCards(res.data)
        if (res.data.length > 0) setSelectedCardId(res.data[0].cardId)
      })
      .catch(() => setCards([]))
  }, [])

  const handleIssueCard = async (monthlyLimit) => {
    setIssuingCard(true)
    try {
      const res = await issueCard({ monthlyLimit })
      setCards((prev) => [...prev, res.data])
      setSelectedCardId(res.data.cardId)
      setShowLimitForm(false)
    } catch {
      const text = '카드 발급에 실패했습니다. 잠시 후 다시 시도해주세요.'
      setMessage(text)
      showError(text)
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
      const booksRes = await getBooks({ size: 1000 })
      const availableIds = new Set(booksRes.data.content.map((b) => b.bookId))
      const staleItem = items.find((i) => !availableIds.has(i.bookId))
      if (staleItem) {
        const text = `${staleItem.title}은(는) 판매가 종료되어 결제를 진행할 수 없습니다. 장바구니에서 확인해주세요.`
        setStatus('declined')
        setMessage(text)
        showError(text)
        return
      }

      // 주문 생성 (PENDING_PAYMENT)
      const orderRes = await createOrder({
        orderItems: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
      })
      const orderId = orderRes.data.orderId

      // REQ-06: 카드 결제 요청 (카드 존재/상태/한도 순차 검증, 거절 시 에러로 응답)
      const { paymentId, approvalNumber, amount } = await requestPayment({
        orderId,
        cardId: selectedCardId,
      })

      setPaymentResult({ paymentId, approvalNumber, amount })
      setStatus('approved')
      await clearCartItems(items)
      notifyCartChanged()
    } catch (err) {
      const text = getErrorMessage(err, '결제 처리 중 오류가 발생했습니다.')
      setStatus('declined')
      setMessage(text)
      showError(text)
    }
  }

  // 카카오페이는 카드 결제와 달리 이 페이지에서 결제가 끝나지 않는다. 새 탭(window.open)으로
  // 카카오 결제 페이지를 열고, 이 탭(체크아웃 페이지)은 그대로 남겨둔다. 새 탭에서 결제를
  // 마치면 카카오가 그 새 탭을 /payments/kakao/callback으로 리다이렉트시키고, 거기서
  // approveKakaoPay가 실행되어 승인이 끝난다(KakaoPayCallback.jsx는 그대로 유지).
  // 원래 탭(여기)은 그 사실을 알 방법이 없으므로, 사용자가 "확인하기"를 누르면 주문 목록을
  // 다시 조회해서 orderStatus로 결제 완료 여부를 판단한다(폴링 대신 수동 확인 - postMessage/
  // window.opener 방식보다 팝업 차단/COOP 등 크로스탭 이슈에 안전해서 데모 안정성이 낫다).
  const handleKakaoPay = async () => {
    setStatus('processing')
    setMessage('')
    try {
      // 장바구니 페이지 확인 이후 시간차로 판매 종료됐을 수 있으니 결제 직전 한 번 더 대조
      const booksRes = await getBooks({ size: 1000 })
      const availableIds = new Set(booksRes.data.content.map((b) => b.bookId))
      const staleItem = items.find((i) => !availableIds.has(i.bookId))
      if (staleItem) {
        const text = `${staleItem.title}은(는) 판매가 종료되어 결제를 진행할 수 없습니다. 장바구니에서 확인해주세요.`
        setStatus('declined')
        setMessage(text)
        showError(text)
        return
      }

      // 주문 생성 (PENDING_PAYMENT)
      const orderRes = await createOrder({
        orderItems: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
      })
      const orderId = orderRes.data.orderId

      const readyRes = await requestKakaoPayReady({ orderId })
      saveKakaoPaySession({ orderId, tid: readyRes.data.tid })

      // 모바일 여부는 일단 PC 기준으로만 처리 (필요하면 나중에 UA로 분기)
      // 'noopener' 옵션은 스펙상 팝업이 성공적으로 열려도 window.open()이 항상 null을
      // 반환하게 만들어 차단 여부 판별이 불가능해진다. 대신 반환된 레퍼런스에
      // opener = null을 대입해서 opener 참조를 끊는다 - 확인은 window.opener/postMessage가
      // 아니라 주문 상태 재조회로 하므로 안전하게 끊어도 된다.
      const kakaoWindow = window.open(readyRes.data.nextRedirectPcUrl, '_blank')
      if (!kakaoWindow) {
        // 팝업이 차단된 경우: 기존 방식(현재 탭 이동)으로 폴백 -> KakaoPayCallback.jsx가
        // 그대로 처리해준다.
        window.location.href = readyRes.data.nextRedirectPcUrl
        return
      }
      kakaoWindow.opener = null

      setKakaoOrderId(orderId)
      setStatus('kakao_awaiting_confirm')
    } catch (err) {
      const text = getErrorMessage(err, '카카오페이 결제 요청 중 오류가 발생했습니다.')
      setStatus('declined')
      setMessage(text)
      showError(text)
    }
  }

  // "결제를 완료하셨나요? 확인하기" 버튼 핸들러. 새 탭에서 승인(approveKakaoPay)이 끝나면
  // 백엔드 주문 상태가 PAID로 바뀌어 있으므로, 그걸로 완료 여부를 판단한다.
  const handleCheckKakaoStatus = async () => {
    setCheckingKakaoStatus(true)
    setMessage('')
    try {
      const res = await getMyOrders()
      const order = res.data.find((o) => o.orderId === kakaoOrderId)
      if (!order) {
        setMessage('주문 정보를 확인할 수 없습니다. 잠시 후 다시 확인해주세요.')
        return
      }
      if (order.orderStatus === 'PAID') {
        clearKakaoPaySession()
        await clearCartItems(items)
        notifyCartChanged()
        setStatus('approved')
      } else if (order.orderStatus === 'PAYMENT_FAILED' || order.orderStatus === 'CANCELLED') {
        setStatus('declined')
        setMessage('카카오페이 결제가 완료되지 않았습니다. 다시 시도해주세요.')
      } else {
        setMessage('아직 결제가 완료되지 않았습니다. 새 탭에서 결제를 완료한 후 다시 확인해주세요.')
      }
    } catch (err) {
      setMessage(getErrorMessage(err, '결제 상태 확인 중 오류가 발생했습니다.'))
    } finally {
      setCheckingKakaoStatus(false)
    }
  }

  if (cartLoading) {
    return <p className="text-sm">불러오는 중...</p>
  }

  if (status === 'approved') {
    return <PaymentSuccessScreen {...paymentResult} />
  }

  if (status === 'kakao_awaiting_confirm') {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-ink)' }}>
          카카오페이 결제 진행 중...
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--color-clay)' }}>
          새로 열린 탭에서 결제를 완료해주세요. 완료 후 아래 버튼을 눌러 확인해주세요.
        </p>
        {message && (
          <p className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
            {message}
          </p>
        )}
        <button
          onClick={handleCheckKakaoStatus}
          disabled={checkingKakaoStatus}
          className="px-4 py-2.5 rounded text-white font-medium disabled:opacity-50"
          style={{ background: 'var(--color-ink)' }}
        >
          {checkingKakaoStatus ? '확인 중...' : '결제를 완료하셨나요? 확인하기'}
        </button>
        <div>
          <button
            onClick={() => {
              setStatus('idle')
              setMessage('')
            }}
            className="text-sm underline mt-4"
            style={{ color: 'var(--color-clay)' }}
          >
            다른 결제수단으로 다시 선택하기
          </button>
        </div>
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
            <div key={i.cartItemId} className="flex justify-between text-sm py-1">
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
        <h2 className="text-sm font-medium mb-2">결제수단</h2>
        <div className="flex gap-2">
          <label
            className="flex-1 flex items-center gap-2 border rounded px-4 py-2.5 cursor-pointer text-sm"
            style={{
              borderColor: paymentMethod === 'CARD' ? 'var(--color-clay)' : 'var(--color-line)',
            }}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'CARD'}
              onChange={() => setPaymentMethod('CARD')}
            />
            가상 카드
          </label>
          <label
            className="flex-1 flex items-center gap-2 border rounded px-4 py-2.5 cursor-pointer text-sm"
            style={{
              borderColor: paymentMethod === 'KAKAOPAY' ? 'var(--color-clay)' : 'var(--color-line)',
            }}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'KAKAOPAY'}
              onChange={() => setPaymentMethod('KAKAOPAY')}
            />
            카카오페이
          </label>
        </div>
      </section>

      {paymentMethod === 'CARD' && (
      <section className="mb-6">
        <h2 className="text-sm font-medium mb-2">결제 카드</h2>
        {cards.length === 0 ? (
          showLimitForm ? (
            <CardLimitForm
              submitting={issuingCard}
              onSubmit={handleIssueCard}
              onCancel={() => setShowLimitForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowLimitForm(true)}
              className="w-full py-2.5 rounded border font-medium"
              style={{ borderColor: 'var(--color-clay)', color: 'var(--color-clay)' }}
            >
              가상 카드 발급받기
            </button>
          )
        ) : (
          <div className="flex flex-col gap-2">
            {cards.map((card) => {
              const remainingLimit = card.monthlyLimit - card.currentUsage
              return (
                <label
                  key={card.cardId}
                  className="flex items-center gap-3 border rounded px-4 py-2.5 cursor-pointer text-sm"
                  style={{
                    borderColor: selectedCardId === card.cardId ? 'var(--color-clay)' : 'var(--color-line)',
                  }}
                >
                  <input
                    type="radio"
                    name="card"
                    checked={selectedCardId === card.cardId}
                    onChange={() => setSelectedCardId(card.cardId)}
                  />
                  <span>{card.maskedCardNumber}</span>
                  <span className="ml-auto" style={{ color: 'var(--color-clay)' }}>
                    한도 {remainingLimit?.toLocaleString()}원
                  </span>
                </label>
              )
            })}

            {showLimitForm ? (
              <CardLimitForm
                submitting={issuingCard}
                onSubmit={handleIssueCard}
                onCancel={() => setShowLimitForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowLimitForm(true)}
                className="text-sm underline self-start mt-1"
                style={{ color: 'var(--color-clay)' }}
              >
                카드 추가 발급
              </button>
            )}
          </div>
        )}
      </section>
      )}

      {paymentMethod === 'KAKAOPAY' && (
        <section className="mb-6">
          <p className="text-sm" style={{ color: 'var(--color-clay)' }}>
            새 탭에서 카카오페이 결제 페이지가 열립니다. 이 탭은 그대로 두고 결제를 진행해주세요.
          </p>
        </section>
      )}

      {message && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-danger)' }}>
          {message}
        </p>
      )}

      {paymentMethod === 'CARD' ? (
        <button
          onClick={handlePay}
          disabled={status === 'processing'}
          className="w-full py-3 rounded text-white font-medium disabled:opacity-50"
          style={{ background: 'var(--color-ink)' }}
        >
          {status === 'processing' ? '결제 처리 중...' : `${totalPrice.toLocaleString()}원 결제하기`}
        </button>
      ) : (
        <button
          onClick={handleKakaoPay}
          disabled={status === 'processing'}
          className="w-full py-3 rounded text-white font-medium disabled:opacity-50"
          style={{ background: '#FEE500', color: '#000000' }}
        >
          {status === 'processing' ? '새 탭 여는 중...' : '카카오페이로 결제하기'}
        </button>
      )}
    </div>
  )
}
