import apiClient from './client'
import { mockGetAdminOrders } from './mockAdminOrders'

// Spring Data Pageable 관례에 맞춰 page는 0부터 시작한다고 가정 (getBooks와 동일한 관례)
export const getAdminOrders = async ({ page = 0, size = 10, status = '' } = {}) => {
  const params = { page, size }
  if (status) params.status = status

  try {
    return await apiClient.get('/api/admin/orders', { params })
  } catch {
    return mockGetAdminOrders({ page, size, status })
  }
}
