import { readMockList, writeMockList, nextMockId, mockApiError } from './mockStorage'
import { getMockSessionUserId, setMockSessionUserId, clearMockSessionUserId } from './mockSession'

export const USERS_KEY = 'bookmeogeun-mock-users'

const toPublicUser = (user) => ({ id: user.id, username: user.username, name: user.name })

export const mockSignup = ({ username, password, name }) => {
  const users = readMockList(USERS_KEY)
  if (users.some((u) => u.username === username)) {
    throw mockApiError('이미 사용 중인 아이디입니다.')
  }
  const user = { id: nextMockId(users), username, password, name }
  writeMockList(USERS_KEY, [...users, user])
  return { data: toPublicUser(user) }
}

export const mockLogin = ({ username, password }) => {
  const users = readMockList(USERS_KEY)
  const user = users.find((u) => u.username === username && u.password === password)
  if (!user) {
    throw mockApiError('아이디 또는 비밀번호를 확인해주세요.')
  }
  setMockSessionUserId(user.id)
  // JWT 방식: { accessToken, user } 형태로 응답
  return {
    data: {
      accessToken: `mock-access-token.${user.id}.${Date.now()}`,
      user: toPublicUser(user),
    },
  }
}

export const mockLogout = () => {
  clearMockSessionUserId()
  return { data: {} }
}

export const mockGetMyInfo = () => {
  const userId = getMockSessionUserId()
  if (!userId) return { data: null }
  const user = readMockList(USERS_KEY).find((u) => u.id === userId)
  return { data: user ? toPublicUser(user) : null }
}
