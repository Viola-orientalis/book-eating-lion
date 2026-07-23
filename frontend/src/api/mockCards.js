import { readMockList, writeMockList, mockApiError } from './mockStorage'
import { getMockSessionUserId } from './mockSession'

export const CARDS_KEY = 'bookmeogeun-mock-cards'
const DEFAULT_MONTHLY_LIMIT = 1000000

const randomDigits = (length) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')

const generateMaskedCardNumber = () => `${randomDigits(4)}-****-****-${randomDigits(4)}`

// nextMockId(mockStorage.js)는 item.id 기준으로 채번하는 공용 헬퍼라 cardId 필드와
// 맞지 않아, 카드 목록 전용으로 cardId 기준 채번 함수를 따로 둔다.
const nextCardId = (cards) =>
  cards.reduce((max, c) => Math.max(max, c.cardId), 0) + 1

export const mockIssueCard = ({ monthlyLimit } = {}) => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.', 'UNAUTHENTICATED')

  const cards = readMockList(CARDS_KEY)
  const card = {
    cardId: nextCardId(cards),
    userId,
    maskedCardNumber: generateMaskedCardNumber(),
    cardStatus: 'ACTIVE',
    monthlyLimit: Number(monthlyLimit) > 0 ? Number(monthlyLimit) : DEFAULT_MONTHLY_LIMIT,
    currentUsage: 0,
    createdAt: new Date().toISOString(),
  }
  writeMockList(CARDS_KEY, [...cards, card])
  return { data: card }
}

export const mockGetMyCards = () => {
  const userId = getMockSessionUserId()
  const cards = readMockList(CARDS_KEY).filter((c) => c.userId === userId)
  return { data: cards }
}

// 결제 승인/취소 로직(mockPayments)에서 참조하는 내부 헬퍼
export const getMockCardById = (cardId) =>
  readMockList(CARDS_KEY).find((c) => c.cardId === cardId)

// delta > 0: 결제로 사용액 증가, delta < 0: 취소/환불로 사용액 감소
export const adjustMockCardUsage = (cardId, delta) => {
  const cards = readMockList(CARDS_KEY)
  writeMockList(
    CARDS_KEY,
    cards.map((c) =>
      c.cardId === cardId ? { ...c, currentUsage: Math.max(0, c.currentUsage + delta) } : c
    )
  )
}
