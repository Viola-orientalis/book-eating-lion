import { useNavigate } from 'react-router-dom'

// 카드 결제(Checkout.jsx)/카카오페이 콜백(KakaoPayCallback.jsx) 양쪽에서 쓰는
// 결제 완료 화면. 결제수단이 달라도 완료 후 화면은 동일하다.
// paymentId/approvalNumber/amount는 approve 응답에서 넘어온 값 - 카카오페이 팝업
// 확인(Checkout.jsx의 handleCheckKakaoStatus)처럼 원래 탭에서 승인 상세를 모르는
// 경로도 있어 전부 optional로 두고, 있을 때만 상세 정보를 표시한다.
export default function PaymentSuccessScreen({ paymentId, approvalNumber, amount } = {}) {
  const navigate = useNavigate()
  const hasDetails = paymentId != null || approvalNumber != null || amount != null

  return (
    <div className="text-center py-20">
      <p className="text-2xl font-display font-bold mb-2" style={{ color: 'var(--color-forest)' }}>
        결제가 완료되었습니다
      </p>
      <p className="text-sm mb-6" style={{ color: 'var(--color-clay)' }}>
        영수증은 결제내역에서 확인하실 수 있어요
      </p>

      {hasDetails && (
        <div
          className="max-w-xs mx-auto mb-6 border rounded px-4 py-3 text-left text-sm"
          style={{ borderColor: 'var(--color-line)' }}
        >
          {amount != null && (
            <div className="flex justify-between py-1">
              <span style={{ color: 'var(--color-clay)' }}>결제 금액</span>
              <span className="font-semibold" style={{ color: 'var(--color-gold)' }}>
                {amount.toLocaleString()}원
              </span>
            </div>
          )}
          {approvalNumber != null && (
            <div className="flex justify-between py-1">
              <span style={{ color: 'var(--color-clay)' }}>승인번호</span>
              <span>{approvalNumber}</span>
            </div>
          )}
          {paymentId != null && (
            <div className="flex justify-between py-1">
              <span style={{ color: 'var(--color-clay)' }}>결제ID</span>
              <span>{paymentId}</span>
            </div>
          )}
        </div>
      )}

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
