// TODO: 백엔드 실제 API 스펙 확정되면 엔드포인트/필드명 재확인 필요.
// 아래 세 엔드포인트는 아직 백엔드에 존재하지 않는 것으로 가정한 것이며, 응답 구조도
// 임시로 가정한 형태다. 404 등으로 실패하는 경우 호출부(AdminDashboard.jsx)에서
// 에러를 노출하지 않고 조용한 빈 상태로 대체하므로 여기서는 mock 폴백을 두지 않는다.
import apiClient from './client'

// 응답 예시: { totalMembers, totalOrders, totalRevenue, totalBooks }
export const getAdminStatsSummary = () => apiClient.get('/api/admin/stats/summary')

// 응답 예시: { ageGroups: [{ range, count }], genderPreference: [{ gender, count }] }
export const getAdminStatsDemographics = () => apiClient.get('/api/admin/stats/demographics')

// 응답 예시: [{ date, revenue }]
export const getAdminStatsRevenueTrend = () => apiClient.get('/api/admin/stats/revenue-trend')
