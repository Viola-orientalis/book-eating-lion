import apiClient from './client'
import { mockIssueCard, mockGetMyCards } from './mockCards'

// REQ-05: 가상 카드 발급
export const issueCard = async () => {
  try {
    return await apiClient.post('/api/cards')
  } catch {
    // 백엔드 미연결 시 목 카드 발급으로 대체
    return mockIssueCard()
  }
}

// 내 카드 목록 조회 (마스킹된 카드번호만 내려옴)
export const getMyCards = async () => {
  try {
    return await apiClient.get('/api/cards/me')
  } catch {
    return mockGetMyCards()
  }
}
