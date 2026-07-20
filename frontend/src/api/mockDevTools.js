// 개발/테스트 전용 헬퍼: 백엔드 없이 "도서 삭제(판매 종료)" 상황을 브라우저 콘솔에서 재현하기 위한 도구.
// main.jsx에서 개발 모드일 때만 import되어 window.mockAdmin으로 노출된다.
// 실제 배포 시엔 이 파일과 main.jsx의 import를 제거해도 무방하다.
import { markMockBookDeleted, restoreMockBook, getMockDeletedBookIds } from './mockDeletedBooks'
import { MOCK_BOOKS } from './mockBooks'

export const installMockDevTools = () => {
  if (typeof window === 'undefined') return

  window.mockAdmin = {
    listBooks: () => MOCK_BOOKS.map((b) => ({ bookId: b.bookId, title: b.title })),
    listDeleted: () => getMockDeletedBookIds(),
    deleteBook: (bookId) => {
      markMockBookDeleted(bookId)
      console.log(
        `[mockAdmin] 도서 ${bookId} 삭제 처리됨. 이후 getBooks() 응답에서 제외됩니다. ` +
          '장바구니/결제 페이지를 새로고침해서 동작을 확인하세요.'
      )
    },
    restoreBook: (bookId) => {
      restoreMockBook(bookId)
      console.log(`[mockAdmin] 도서 ${bookId} 복구됨.`)
    },
  }

  console.log(
    '[mockAdmin] 개발용 도구가 등록되었습니다. window.mockAdmin.listBooks(), ' +
      '.deleteBook(id), .restoreBook(id), .listDeleted() 를 콘솔에서 사용할 수 있습니다.'
  )
}
