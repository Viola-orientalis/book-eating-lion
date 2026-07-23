import { readMockList, writeMockList, mockApiError } from './mockStorage'
import { MOCK_BOOKS } from './mockBooks'

export const ADMIN_BOOKS_KEY = 'bookmeogeun-mock-admin-books'

const seedAdminBooks = () => {
  const seeded = MOCK_BOOKS.map((b) => ({ ...b, status: 'ON_SALE', imageUrl: null }))
  writeMockList(ADMIN_BOOKS_KEY, seeded)
  return seeded
}

const readAdminBooks = () => {
  const list = readMockList(ADMIN_BOOKS_KEY)
  return list.length > 0 ? list : seedAdminBooks()
}

const nextAdminBookId = (list) => list.reduce((max, b) => Math.max(max, b.bookId), 0) + 1

export const mockGetAdminBooks = () => ({ data: { content: readAdminBooks() } })

// imageFile은 실제 백엔드가 없는 개발 환경에서만 미리보기를 위해 objectURL로 대체한다.
// (새로고침 시 사라지는 임시 URL이며, 실제 업로드/영속화는 백엔드 연동 후 대체된다.)
export const mockCreateAdminBook = (bookData, imageFile) => {
  const list = readAdminBooks()
  const book = {
    ...bookData,
    bookId: nextAdminBookId(list),
    status: 'ON_SALE',
    imageUrl: imageFile ? URL.createObjectURL(imageFile) : null,
  }
  writeMockList(ADMIN_BOOKS_KEY, [...list, book])
  return { data: book }
}

export const mockUpdateAdminBook = (bookId, bookData, imageFile) => {
  const list = readAdminBooks()
  const target = list.find((b) => b.bookId === Number(bookId))
  if (!target) throw mockApiError('도서를 찾을 수 없습니다.', 'BOOK_NOT_FOUND')

  const updated = {
    ...target,
    ...bookData,
    imageUrl: imageFile ? URL.createObjectURL(imageFile) : target.imageUrl,
  }
  writeMockList(
    ADMIN_BOOKS_KEY,
    list.map((b) => (b.bookId === updated.bookId ? updated : b))
  )
  return { data: updated }
}

// 물리적 삭제가 아니라 판매중지 처리 — 목록에는 남고 status만 바뀐다.
export const mockDeleteAdminBook = (bookId) => {
  const list = readAdminBooks()
  const target = list.find((b) => b.bookId === Number(bookId))
  if (!target) throw mockApiError('도서를 찾을 수 없습니다.', 'BOOK_NOT_FOUND')

  const updated = { ...target, status: 'STOPPED' }
  writeMockList(
    ADMIN_BOOKS_KEY,
    list.map((b) => (b.bookId === updated.bookId ? updated : b))
  )
  return { data: updated }
}
