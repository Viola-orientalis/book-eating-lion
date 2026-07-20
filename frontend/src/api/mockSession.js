// mock 로그인 세션(현재 로그인한 사용자 id)을 localStorage에 보관.
// mockAuth의 getMyInfo가 이 값을 읽어 AuthContext.user를 채우므로,
// mockOrders/mockCards/mockPayments도 이 값을 기준으로 "로그인한 사용자"를 판단한다.
export const SESSION_KEY = 'bookmeogeun-mock-session'

export const getMockSessionUserId = () => {
  const raw = localStorage.getItem(SESSION_KEY)
  return raw ? Number(raw) : null
}

export const setMockSessionUserId = (userId) => {
  localStorage.setItem(SESSION_KEY, String(userId))
}

export const clearMockSessionUserId = () => {
  localStorage.removeItem(SESSION_KEY)
}
