import apiClient from './client'
import { mockSignup, mockLogin, mockLogout, mockGetMyInfo, mockDeleteAccount } from './mockAuth'

// REQ-01: 회원가입
export const signup = async (payload) => {
  const body = {
    username: payload.loginId || payload.username,
    password: payload.password,
    name: payload.name,
  }
  return await apiClient.post('/api/auth/signup', body)
}
// payload 예시: { username, password, name }

// REQ-02: 로그인
export const login = async (payload) => {
  const body = {
    username: payload.loginId || payload.username,
    password: payload.password,
  }
  return await apiClient.post('/api/auth/login', body)
}
// payload 예시: { username, password }
// 응답 예시(평탄한 형태): { accessToken, memberId, name, role }

export const logout = async () => {
  try {
    return await apiClient.post('/api/auth/logout')
  } finally {
    // JWT는 클라이언트가 들고 있는 토큰을 지우는 것으로 로그아웃 처리
    localStorage.removeItem('accessToken')
  }
}

export const getMyInfo = async () => {
  return await apiClient.get('/api/auth/me')
}
// 응답 예시: { memberId, username, name, role, createdAt }

// 회원 탈퇴
export const deleteAccount = async () => {
  try {
    return await apiClient.delete('/api/auth/me')
  } catch {
    return mockDeleteAccount()
  }
}
