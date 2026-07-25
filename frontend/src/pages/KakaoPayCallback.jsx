import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { approveKakaoPay, readKakaoPaySession, clearKakaoPaySession } from '../api/payments'
import { getCart, clearCartItems } from '../api/cart'
import { notifyCartChanged } from '../api/cartEvents'
import PaymentSuccessScreen from '../components/PaymentSuccessScreen'
import { getErrorMessage } from '../utils/errorMessage'

// 카카오페이 결제 페이지에서 돌아오는 콜백. Checkout.jsx가 ready 요청 직후
// sessionStorage에 저장해 둔 tid/orderId와, 카카오가 쿼리스트링으로 붙여주는
// pg_token으로 최종 승인(approveKakaoPay)까지 처리한다.
export default function KakaoPayCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('processing') // processing | approved | failed
  const [message, setMessage] = useState('')
  const [paymentResult, setPaymentResult] = useState(null)

  useEffect(() => {
    const approve = async () => {
      const pgToken = searchParams.get('pg_token')
      const session = readKakaoPaySession()

      if (!pgToken || !session) {
        setStatus('failed')
        setMessage('결제 정보를 확인할 수 없습니다. 처음부터 다시 시도해주세요.')
        return
      }

      try {
        const { paymentId, approvalNumber, status: approveStatus, amount } = await approveKakaoPay({
          orderId: session.orderId,
          tid: session.tid,
          pgToken,
        })

        if (approveStatus !== 'APPROVED') {
          setStatus('failed')
          setMessage('카카오페이 결제 승인에 실패했습니다.')
          return
        }

        clearKakaoPaySession()

        try {
          const cartRes = await getCart()
          await clearCartItems(cartRes.data)
          notifyCartChanged()
        } catch {
          // 장바구니 비우기 실패는 결제 성공 자체를 막을 이유가 아니므로 조용히 넘어간다
        }

        setPaymentResult({ paymentId, approvalNumber, amount })
        setStatus('approved')
      } catch (err) {
        setStatus('failed')
        setMessage(getErrorMessage(err, '카카오페이 결제 승인에 실패했습니다.'))
      }
    }
    approve()
    // 최초 진입 시 한 번만 승인 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'processing') {
    return <p className="text-sm">결제 승인 처리 중...</p>
  }

  if (status === 'approved') {
    return <PaymentSuccessScreen {...paymentResult} />
  }

  return (
    <div className="text-center py-20">
      <p className="text-2xl font-display font-bold mb-2" style={{ color: 'var(--color-danger)' }}>
        결제 승인에 실패했습니다
      </p>
      <p className="text-sm mb-6" style={{ color: 'var(--color-clay)' }}>
        {message}
      </p>
      <button
        onClick={() => navigate('/checkout')}
        className="px-4 py-2 rounded text-white"
        style={{ background: 'var(--color-ink)' }}
      >
        결제 다시 시도하기
      </button>
    </div>
  )
}
