import { readMockList, writeMockList, nextMockId, mockApiError } from './mockStorage'
import { getMockSessionUserId } from './mockSession'

export const CARDS_KEY = 'bookmeogeun-mock-cards'
const CREDIT_LIMIT = 500000

const randomDigits = (length) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')

const generateMaskedCardNumber = () => `${randomDigits(4)}-****-****-${randomDigits(4)}`

export const mockIssueCard = () => {
  const userId = getMockSessionUserId()
  if (!userId) throw mockApiError('로그인이 필요합니다.')

  const cards = readMockList(CARDS_KEY)
  const card = {
    id: nextMockId(cards),
    userId,
    maskedCardNumber: generateMaskedCardNumber(),
    status: 'ACTIVE',
    creditLimit: CREDIT_LIMIT,
    remainingLimit: CREDIT_LIMIT,
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
  readMockList(CARDS_KEY).find((c) => c.id === cardId)

export const adjustMockCardLimit = (cardId, delta) => {
  const cards = readMockList(CARDS_KEY)
  writeMockList(
    CARDS_KEY,
    cards.map((c) => (c.id === cardId ? { ...c, remainingLimit: c.remainingLimit + delta } : c))
  )
}
