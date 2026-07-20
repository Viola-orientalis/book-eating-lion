import { useState } from 'react'

export const MIN_MONTHLY_LIMIT = 10000
const DEFAULT_MONTHLY_LIMIT = 1000000

// 카드 발급 시 월 한도를 입력받는 인라인 폼. prompt() 대신 버튼 자리에 나타난다.
export default function CardLimitForm({ submitting, onSubmit, onCancel }) {
  const [amount, setAmount] = useState(String(DEFAULT_MONTHLY_LIMIT))

  const numericAmount = Number(amount)
  const invalid = amount === '' || Number.isNaN(numericAmount) || numericAmount < MIN_MONTHLY_LIMIT

  const handleSubmit = (e) => {
    e.preventDefault()
    if (invalid) return
    onSubmit(numericAmount)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border rounded px-4 py-3"
      style={{ borderColor: 'var(--color-clay)', background: 'var(--color-paper-soft)' }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: 'var(--color-ink)' }}>월 한도 (원)</span>
        <input
          type="number"
          min={MIN_MONTHLY_LIMIT}
          step={10000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={submitting}
          autoFocus
          className="border rounded px-3 py-2 text-sm outline-none disabled:opacity-50"
          style={{ borderColor: 'var(--color-line)' }}
        />
      </label>

      {invalid && (
        <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
          {MIN_MONTHLY_LIMIT.toLocaleString()}원 이상 입력해주세요.
        </p>
      )}

      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          disabled={submitting || invalid}
          className="flex-1 py-2 rounded text-white text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--color-ink)' }}
        >
          {submitting ? '발급 중...' : '발급하기'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 py-2 rounded border text-sm disabled:opacity-50"
          style={{ borderColor: 'var(--color-line)', color: 'var(--color-clay)' }}
        >
          취소
        </button>
      </div>
    </form>
  )
}
