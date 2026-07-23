import { useEffect, useState } from 'react'
import { getMyPayments, cancelPayment, getPaymentReceipt } from '../api/payments'
import { getStatusLabel, STATUS_BADGE_COLOR } from '../utils/statusLabels'
import { formatDateTime } from '../utils/formatDate'
import ListSkeleton from '../components/skeletons/ListSkeleton'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'

export default function Payments() {
  const { showError } = useToast()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [receiptLoadingId, setReceiptLoadingId] = useState(null)
  const [cancelTargetId, setCancelTargetId] = useState(null)
  const [cancelStep, setCancelStep] = useState(null) // 'confirm' | 'reason' | null
  const [cancelReason, setCancelReason] = useState('')

  const load = () => {
    getMyPayments()
      .then((res) => setPayments(res.data))
      .catch((err) => {
        setPayments([])
        showError(getErrorMessage(err, '결제 내역을 불러오지 못했습니다.'))
      })
      .finally(() => setLoading(false))
  }

  // 최초 1회만 조회, load/showError는 매 렌더 재생성되지만 여기선 무시해도 안전하다
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [])

  const handleCancel = async (paymentId, reason) => {
    setCancellingId(paymentId)
    try {
      await cancelPayment(paymentId, reason)
      load()
    } catch (err) {
      showError(getErrorMessage(err, '결제 취소에 실패했습니다.'))
    } finally {
      setCancellingId(null)
    }
  }

  const openCancelConfirm = (paymentId) => {
    setCancelTargetId(paymentId)
    setCancelStep('confirm')
  }

  const closeCancelModal = () => {
    setCancelStep(null)
    setCancelTargetId(null)
    setCancelReason('')
  }

  const proceedToReasonStep = () => setCancelStep('reason')

  const submitCancelReason = () => {
    const trimmed = cancelReason.trim()
    if (!trimmed) return
    handleCancel(cancelTargetId, trimmed)
    closeCancelModal()
  }

  const handleReceipt = async (paymentId) => {
    setReceiptLoadingId(paymentId)
    try {
      // 로컬 mock 저장소에 없는(실제 백엔드에서 온) 결제도 PDF를 만들 수 있도록,
      // 이미 화면에 로드된 결제 데이터를 폴백으로 함께 넘긴다.
      const fallbackPayment = payments.find((p) => p.paymentId === paymentId)
      const res = await getPaymentReceipt(paymentId, fallbackPayment)
      window.open(res.data.url, '_blank')
    } catch (err) {
      showError(getErrorMessage(err, '영수증을 불러오지 못했습니다.'))
    } finally {
      setReceiptLoadingId(null)
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--color-ink)' }}>
        결제내역
      </h1>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : payments.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>
          결제 내역이 없습니다
        </p>
      ) : (
        <div>
          {payments.map((p) => {
            const badgeColor = STATUS_BADGE_COLOR[p.status] || 'var(--color-ink)'
            return (
              <div
                key={p.paymentId}
                className="rounded-xl border border-[var(--color-line)] shadow-sm hover:shadow-md transition-shadow px-4 py-4 mb-3 flex items-center justify-between"
                style={{ background: 'var(--color-paper-soft)' }}
              >
                <div>
                  <p className="text-lg font-semibold" style={{ color: 'var(--color-gold)' }}>
                    {p.amount?.toLocaleString()}원
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-ink)' }}>
                    {p.merchantName || '책 먹는 사자'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        color: badgeColor,
                        background: `color-mix(in srgb, ${badgeColor} 15%, white)`,
                      }}
                    >
                      {getStatusLabel(p.status)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-clay)' }}>
                      {formatDateTime(p.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReceipt(p.paymentId)}
                    disabled={receiptLoadingId === p.paymentId}
                    className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--color-line)]/40 disabled:opacity-50"
                    style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}
                  >
                    {receiptLoadingId === p.paymentId ? '불러오는 중...' : '명세서'}
                  </button>
                  {p.status === 'APPROVED' && (
                    <button
                      onClick={() => openCancelConfirm(p.paymentId)}
                      disabled={cancellingId === p.paymentId}
                      className="text-sm underline transition-colors disabled:opacity-50 text-[var(--color-danger)] hover:text-red-500"
                    >
                      {cancellingId === p.paymentId ? '취소 중...' : '취소'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {cancelStep === 'confirm' && (
        <Modal onClose={closeCancelModal}>
          <p className="font-medium" style={{ color: 'var(--color-ink)' }}>
            이 결제를 취소하시겠습니까?
          </p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={closeCancelModal}
              className="flex-1 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-line)', color: 'var(--color-clay)' }}
            >
              닫기
            </button>
            <button
              onClick={proceedToReasonStep}
              className="flex-1 py-2 rounded-lg text-white text-sm font-medium"
              style={{ background: 'var(--color-ink)' }}
            >
              확인
            </button>
          </div>
        </Modal>
      )}

      {cancelStep === 'reason' && (
        <Modal onClose={closeCancelModal}>
          <p className="font-medium mb-3" style={{ color: 'var(--color-ink)' }}>
            취소 사유를 입력해주세요
          </p>
          <input
            type="text"
            autoFocus
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="취소 사유를 입력해주세요"
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--color-line)' }}
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={closeCancelModal}
              className="flex-1 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-line)', color: 'var(--color-clay)' }}
            >
              닫기
            </button>
            <button
              onClick={submitCancelReason}
              disabled={!cancelReason.trim()}
              className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--color-ink)' }}
            >
              제출
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
