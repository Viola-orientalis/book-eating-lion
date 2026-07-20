import apiClient from './client'
import { MOCK_BOOKS } from './mockBooks'
import { withMockStock } from './mockStock'
import { isMockBookDeleted } from './mockDeletedBooks'

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20

// 백엔드(Spring Data Pageable) 기준 page는 0부터 시작한다고 가정
const mockGetBooks = ({ keyword = '', category = '', page = DEFAULT_PAGE, size = DEFAULT_SIZE } = {}) => {
  let books = MOCK_BOOKS.filter((b) => !isMockBookDeleted(b.bookId)).map(withMockStock)

  if (keyword) {
    const lower = keyword.toLowerCase()
    books = books.filter(
      (b) => b.title.toLowerCase().includes(lower) || b.author.toLowerCase().includes(lower)
    )
  }
  if (category) {
    books = books.filter((b) => b.category === category)
  }

  const totalElements = books.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const currentPage = Math.min(Math.max(0, Number(page)), totalPages - 1)
  const start = currentPage * size
  const content = books.slice(start, start + size)

  return {
    data: {
      content,
      pageInfo: {
        currentPage,
        pageSize: Number(size),
        totalElements,
        totalPages,
      },
    },
  }
}

// REQ-03: 도서 목록 조회
// params 예시: { keyword, category, page, size }
// 응답 예시: { content: [...], pageInfo: { currentPage, pageSize, totalElements, totalPages } }
export const getBooks = async (params = {}) => {
  try {
    return await apiClient.get('/api/books', { params })
  } catch {
    // 백엔드 미연결 시 목 데이터로 대체
    return mockGetBooks(params)
  }
}

// REQ-03: 도서 상세 조회
export const getBookDetail = async (bookId) => {
  try {
    return await apiClient.get(`/api/books/${bookId}`)
  } catch {
    // 백엔드 미연결 시 목 데이터에서 조회 (현재 재고 반영, 삭제된 도서는 없는 것으로 처리)
    const book = MOCK_BOOKS.find((b) => b.bookId === Number(bookId))
    if (!book || isMockBookDeleted(book.bookId)) {
      return { data: null }
    }
    return { data: withMockStock(book) }
  }
}
