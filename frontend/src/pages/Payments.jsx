import { useEffect, useState } from 'react'
import { getMyPayments, cancelPayment, getPaymentReceipt } from '../api/payments'

const STATUS_STYLE = {
  APPROVED: { label: '결제완료', color: 'var(--color-forest)' },
  CANCELLED: { label: '취소됨', color: 'var(--color-clay)' },
  REJECTED: { label: '거절됨', color: 'var(--color-danger)' },
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [receiptLoadingId, setReceiptLoadingId] = useState(null)

  const load = () => {
    getMyPayments()
      .then((res) => setPayments(res.data))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCancel = async (paymentId) => {
    if (!confirm('이 결제를 취소하시겠습니까?')) return
    setCancellingId(paymentId)
    try {
      await cancelPayment(paymentId)
      load()
    } finally {
      setCancellingId(null)
    }
  }

  const handleReceipt = async (paymentId) => {
    setReceiptLoadingId(paymentId)
    try {
      const res = await getPaymentReceipt(paymentId)
      window.open(res.data.url, '_blank')
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
        <p className="text-sm">불러오는 중...</p>
      ) : payments.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>
          결제 내역이 없습니다
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((p) => {
            const style = STATUS_STYLE[p.status] || { label: p.status, color: 'var(--color-ink)' }
            return (
              <div
                key={p.id}
                className="border rounded px-4 py-3 flex items-center justify-between"
                style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
              >
                <div>
                  <p className="font-medium" style={{ color: 'var(--color-ink)' }}>
                    {p.merchantName || '책 먹는 사자'} · {p.amount?.toLocaleString()}원
                  </p>
                  <p className="text-xs mt-1" style={{ color: style.color }}>
                    {style.label} · {new Date(p.createdAt).toLocaleString()}
                  </p>
                  {p.status === 'REJECTED' && p.rejectReason && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-danger)' }}>
                      사유: {p.rejectReason}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 text-sm">
                  <button
                    onClick={() => handleReceipt(p.id)}
                    disabled={receiptLoadingId === p.id}
                    className="underline disabled:opacity-50"
                    style={{ color: 'var(--color-gold)' }}
                  >
                    {receiptLoadingId === p.id ? '불러오는 중...' : '명세서'}
                  </button>
                  {p.status === 'APPROVED' && (
                    <button
                      onClick={() => handleCancel(p.id)}
                      disabled={cancellingId === p.id}
                      className="underline disabled:opacity-50"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      {cancellingId === p.id ? '취소 중...' : '취소'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
