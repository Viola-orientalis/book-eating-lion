import apiClient from './client'

// 응답: SummaryResponse { totalSalesAmount, todaySalesAmount, totalOrderCount, lowStockCount }
export const getAdminStatsSummary = () => apiClient.get('/api/admin/stats/summary')

// 응답: SalesTrendDto[] [{ datePeriod, orderCount, salesAmount }, ...]
export const getAdminStatsSalesTrend = () => apiClient.get('/api/admin/stats/sales-trend')

// 응답: DemographicPreferenceDto[] [{ ageGroup, gender, bookId, bookTitle, category,
// totalQuantitySold, totalSalesAmount }, ...] — 도서 단위로 세분화된 원본 데이터라,
// 연령대별/성별 집계나 도서 랭킹은 호출부(AdminDashboard.jsx)에서 reduce로 가공한다.
export const getAdminStatsDemographicPreferences = () =>
  apiClient.get('/api/admin/stats/demographic-preferences')
