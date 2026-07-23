import { readMockList } from './mockStorage'
import { ORDERS_KEY } from './mockOrders'
import { USERS_KEY } from './mockAuth'

export const mockGetAdminOrders = ({ page = 0, size = 10, status = '' } = {}) => {
  const users = readMockList(USERS_KEY)
  let orders = readMockList(ORDERS_KEY)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (status) {
    orders = orders.filter((o) => o.orderStatus === status)
  }

  const totalElements = orders.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const currentPage = Math.min(Math.max(0, Number(page)), totalPages - 1)
  const start = currentPage * size
  const content = orders.slice(start, start + size).map((o) => {
    const user = users.find((u) => u.id === o.userId)
    return {
      orderId: o.id,
      memberId: o.userId,
      loginId: user?.username ?? '알 수 없음',
      totalAmount: o.totalAmount,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt,
    }
  })

  return {
    data: {
      content,
      pageInfo: { currentPage, pageSize: Number(size), totalElements, totalPages },
    },
  }
}
