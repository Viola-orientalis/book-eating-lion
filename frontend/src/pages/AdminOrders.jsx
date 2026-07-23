import { useEffect, useState } from 'react'
import { getAdminOrders } from '../api/adminOrders'
import { getStatusLabel, STATUS_BADGE_COLOR } from '../utils/statusLabels'
import { formatDateTime } from '../utils/formatDate'
import ListSkeleton from '../components/skeletons/ListSkeleton'
import { useToast } from '../context/ToastContext'
import { getErrorMessage } from '../utils/errorMessage'

const PAGE_SIZE = 10
const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PENDING_PAYMENT', label: getStatusLabel('PENDING_PAYMENT') },
  { value: 'PAID', label: getStatusLabel('PAID') },
  { value: 'PAYMENT_FAILED', label: getStatusLabel('PAYMENT_FAILED') },
  { value: 'CANCELLED', label: getStatusLabel('CANCELLED') },
]

export default function AdminOrders() {
  const { showError } = useToast()
  const [orders, setOrders] = useState([])
  const [pageInfo, setPageInfo] = useState(null)
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getAdminOrders({ page, size: PAGE_SIZE, status })
      .then((res) => {
        setOrders(res.data.content)
        setPageInfo(res.data.pageInfo)
      })
      .catch((err) => showError(getErrorMessage(err, '주문 목록을 불러오지 못했습니다.')))
      .finally(() => setLoading(false))
  }, [page, status, showError])

  const handleStatusChange = (e) => {
    setStatus(e.target.value)
    setPage(0)
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--color-ink)' }}>
        전체 주문 조회
      </h1>

      <select
        value={status}
        onChange={handleStatusChange}
        className="border rounded-lg px-3 py-2 text-sm mb-4 outline-none"
        style={{ borderColor: 'var(--color-line)', color: 'var(--color-ink)' }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : orders.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>
          주문 내역이 없습니다
        </p>
      ) : (
        <>
          <div>
            {orders.map((o) => {
              const badgeColor = STATUS_BADGE_COLOR[o.orderStatus] || 'var(--color-ink)'
              return (
                <div
                  key={o.orderId}
                  className="rounded-xl border shadow-sm hover:shadow-md transition-shadow px-4 py-4 mb-3 flex items-center justify-between"
                  style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
                >
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-ink)' }}>
                      주문 #{o.orderId} · {o.loginId} (회원 {o.memberId})
                    </p>
                    <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--color-gold)' }}>
                      {o.totalAmount?.toLocaleString()}원
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-clay)' }}>
                      {formatDateTime(o.createdAt)}
                    </p>
                  </div>

                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      color: badgeColor,
                      background: `color-mix(in srgb, ${badgeColor} 15%, white)`,
                    }}
                  >
                    {getStatusLabel(o.orderStatus)}
                  </span>
                </div>
              )
            })}
          </div>

          {pageInfo && pageInfo.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={pageInfo.currentPage <= 0}
                className="px-3 py-1.5 rounded border disabled:opacity-40"
                style={{ borderColor: 'var(--color-line)' }}
              >
                이전
              </button>
              <span style={{ color: 'var(--color-clay)' }}>
                {pageInfo.currentPage + 1} / {pageInfo.totalPages} 페이지
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageInfo.totalPages - 1, p + 1))}
                disabled={pageInfo.currentPage >= pageInfo.totalPages - 1}
                className="px-3 py-1.5 rounded border disabled:opacity-40"
                style={{ borderColor: 'var(--color-line)' }}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
