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

// "로그인이 필요합니다" 게이트에서 쓰는 인증 여부 판단. 실제 백엔드 JWT 로그인(auth.js의
// login())은 mock 세션을 세팅하지 않으므로(mock 세션은 mockAuth.js의 mockLogin만 세팅하는데,
// 이건 실제 login()이 실패 시 폴백하지 않아 현재 호출되지 않는 죽은 코드다), mock 세션
// 유무만 보면 실제로 로그인한 사용자도 항상 "로그인 필요"로 걸린다. accessToken(실제 JWT)
// 존재 여부도 함께 인정해서 두 로그인 경로 중 어느 쪽으로 로그인했든 게이트를 통과시킨다.
export const isMockOrRealSessionActive = () =>
  Boolean(getMockSessionUserId()) || Boolean(localStorage.getItem('accessToken'))
