import { useEffect, useState } from 'react'
import { getStatements, downloadStatement } from '../api/statements'
import ListSkeleton from '../components/skeletons/ListSkeleton'

const formatDate = (date) => date.toISOString().slice(0, 10)

const defaultRange = () => {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 3)
  return { startDate: formatDate(start), endDate: formatDate(end) }
}

export default function Statements() {
  const [range, setRange] = useState(defaultRange)
  const [statements, setStatements] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  const loadStatements = () => {
    setLoading(true)
    getStatements(range)
      .then((res) => setStatements(res.data))
      .catch(() => setStatements([]))
      .finally(() => {
        setLoading(false)
        setSearched(true)
      })
  }

  useEffect(() => {
    loadStatements()
    // 최초 진입 시 기본 기간(최근 3개월)으로 한 번만 조회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    loadStatements()
  }

  const handleDownload = async (statementId) => {
    setDownloadingId(statementId)
    try {
      const res = await downloadStatement(statementId)
      window.open(res.data.downloadUrl, '_blank')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6" style={{ color: 'var(--color-ink)' }}>
        명세서
      </h1>

      <form onSubmit={handleSearch} className="flex items-end gap-3 mb-6 flex-wrap">
        <label className="flex flex-col gap-1 text-sm">
          <span>시작일</span>
          <input
            type="date"
            value={range.startDate}
            onChange={(e) => setRange((prev) => ({ ...prev, startDate: e.target.value }))}
            className="border rounded px-3 py-2 text-sm"
            style={{ borderColor: 'var(--color-line)' }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>종료일</span>
          <input
            type="date"
            value={range.endDate}
            onChange={(e) => setRange((prev) => ({ ...prev, endDate: e.target.value }))}
            className="border rounded px-3 py-2 text-sm"
            style={{ borderColor: 'var(--color-line)' }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded text-white text-sm disabled:opacity-50"
          style={{ background: 'var(--color-ink)' }}
        >
          {loading ? '조회 중...' : '조회'}
        </button>
      </form>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : statements.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>
          {searched ? '해당 기간에 명세서가 없습니다' : ''}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {statements.map((s) => (
            <div
              key={s.statementId}
              className="border rounded px-4 py-3 flex items-center justify-between"
              style={{ borderColor: 'var(--color-line)', background: 'var(--color-paper-soft)' }}
            >
              <div>
                <p className="font-medium" style={{ color: 'var(--color-ink)' }}>
                  {s.periodStart} ~ {s.periodEnd}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-clay)' }}>
                  {s.paymentCount}건 · 총 {s.totalAmount.toLocaleString()}원
                </p>
              </div>
              <button
                onClick={() => handleDownload(s.statementId)}
                disabled={downloadingId === s.statementId}
                className="text-sm underline disabled:opacity-50"
                style={{ color: 'var(--color-gold)' }}
              >
                {downloadingId === s.statementId ? '불러오는 중...' : '다운로드'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
