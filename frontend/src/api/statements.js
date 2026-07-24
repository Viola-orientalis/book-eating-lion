import apiClient from './client'
import { mockGetStatements, mockDownloadStatement } from './mockStatements'

// REQ-08: 기간별 명세서 목록 조회
// params 예시: { startDate, endDate } (YYYY-MM-DD)
export const getStatements = async ({ startDate, endDate } = {}) => {
  try {
    return await apiClient.get('/api/statements', { params: { startDate, endDate } })
  } catch {
    // 백엔드 미연결 시 결제 내역을 월 단위로 묶어 목 명세서로 대체
    return mockGetStatements({ startDate, endDate })
  }
}

// 백엔드에 명세서 다운로드 API 없음(StatementController/DTO 제거 커밋 6a0f560) - 프론트 자체 생성만 사용
export const downloadStatement = async (statementId) => {
  return mockDownloadStatement(statementId)
}
