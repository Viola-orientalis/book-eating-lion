import { readMockList, writeMockList } from './mockStorage'

// 도서 삭제(판매 종료)를 시뮬레이션하기 위한 mock 상태.
// 여기에 포함된 bookId는 getBooks/getBookDetail 응답에서 제외된다.
export const DELETED_BOOKS_KEY = 'bookmeogeun-mock-deleted-books'

const readDeletedIds = () => readMockList(DELETED_BOOKS_KEY)

export const isMockBookDeleted = (bookId) => readDeletedIds().includes(Number(bookId))

export const markMockBookDeleted = (bookId) => {
  const ids = readDeletedIds()
  if (!ids.includes(Number(bookId))) {
    writeMockList(DELETED_BOOKS_KEY, [...ids, Number(bookId)])
  }
}

export const restoreMockBook = (bookId) => {
  writeMockList(
    DELETED_BOOKS_KEY,
    readDeletedIds().filter((id) => id !== Number(bookId))
  )
}

export const getMockDeletedBookIds = () => readDeletedIds()
