import { useEffect, useState } from 'react'
import { getMyCards, issueCard } from '../api/cards'
import CardLimitForm from '../components/CardLimitForm'

export default function Cards() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)
  const [showLimitForm, setShowLimitForm] = useState(false)

  const loadCards = () => {
    getMyCards()
      .then((res) => setCards(res.data))
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }

  useEffect(loadCards, [])

  const handleIssue = async (monthlyLimit) => {
    setIssuing(true)
    try {
      await issueCard({ monthlyLimit })
      setShowLimitForm(false)
      loadCards()
    } finally {
      setIssuing(false)
    }
  }

  const sortedCards = [...cards].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--color-ink)' }}>
          내 카드
        </h1>
        {!showLimitForm && (
          <button
            onClick={() => setShowLimitForm(true)}
            className="px-4 py-2 rounded text-white text-sm"
            style={{ background: 'var(--color-clay)' }}
          >
            카드 발급
          </button>
        )}
      </div>

      {showLimitForm && (
        <div className="mb-6 max-w-xs ml-auto">
          <CardLimitForm
            submitting={issuing}
            onSubmit={handleIssue}
            onCancel={() => setShowLimitForm(false)}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm">불러오는 중...</p>
      ) : sortedCards.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-clay)' }}>
          발급된 카드가 없습니다
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sortedCards.map((card, index) => {
            const remainingLimit = card.monthlyLimit - card.currentUsage
            return (
              <div
                key={card.id}
                className="rounded-lg p-5 text-white"
                style={{ background: 'var(--color-ink)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs opacity-70">책 먹는 사자 VIRTUAL CARD · {index + 1}번째 발급</p>
                </div>
                <p className="text-lg tracking-widest mb-1">{card.maskedCardNumber}</p>
                {card.createdAt && (
                  <p className="text-xs opacity-70 mb-4">
                    발급일시 {new Date(card.createdAt).toLocaleString()}
                  </p>
                )}
                <div className="flex justify-between text-xs">
                  <span>상태: {STATUS_LABEL[card.cardStatus] || card.cardStatus}</span>
                  <span>한도 {remainingLimit?.toLocaleString()} / {card.monthlyLimit?.toLocaleString()}원</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const STATUS_LABEL = {
  ACTIVE: '정상',
  SUSPENDED: '정지',
  TERMINATED: '해지',
}
