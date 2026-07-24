import { readMockList, writeMockList, nextMockId, mockApiError } from './mockStorage'
import {
  getMockSessionUserId,
  setMockSessionUserId,
  clearMockSessionUserId,
  isMockOrRealSessionActive,
} from './mockSession'

export const USERS_KEY = 'bookmeogeun-mock-users'
const DEFAULT_ROLE = 'USER'

const toMemberInfo = (user) => ({
  memberId: user.id,
  username: user.username,
  name: user.name,
  age: user.age,
  gender: user.gender,
  role: user.role,
  createdAt: user.createdAt,
})

export const mockSignup = ({ username, password, name, age, gender }) => {
  const users = readMockList(USERS_KEY)
  if (users.some((u) => u.username === username)) {
    throw mockApiError('이미 사용 중인 아이디입니다.', 'DUPLICATE_LOGIN_ID')
  }
  const user = {
    id: nextMockId(users),
    username,
    password,
    name,
    age: age ?? null,
    gender: gender ?? null,
    role: DEFAULT_ROLE,
    createdAt: new Date().toISOString(),
  }
  writeMockList(USERS_KEY, [...users, user])
  return { data: toMemberInfo(user) }
}

export const mockLogin = ({ username, password }) => {
  const users = readMockList(USERS_KEY)
  const user = users.find((u) => u.username === username && u.password === password)
  if (!user) {
    throw mockApiError('아이디 또는 비밀번호를 확인해주세요.', 'INVALID_CREDENTIALS')
  }
  setMockSessionUserId(user.id)
  // 로그인 응답은 중첩 없이 평탄화 형태: { accessToken, memberId, name, role }
  return {
    data: {
      accessToken: `mock-access-token.${user.id}.${Date.now()}`,
      memberId: user.id,
      name: user.name,
      role: user.role,
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
  return { data: user ? toMemberInfo(user) : null }
}

export const mockDeleteAccount = () => {
  const userId = getMockSessionUserId()
  if (!isMockOrRealSessionActive()) throw mockApiError('로그인이 필요합니다.', 'UNAUTHENTICATED')
  writeMockList(
    USERS_KEY,
    readMockList(USERS_KEY).filter((u) => u.id !== userId)
  )
  clearMockSessionUserId()
  return { data: {} }
}