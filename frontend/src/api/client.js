import axios from 'axios'

// 로컬 개발: VITE_API_BASE_URL 미설정 시 빈 문자열로 폴백 -> vite.config.js의 /api
// 프록시(→ localhost:8080)를 그대로 탄다. .env.example처럼 .env.local에 직접 설정하면
// 프록시 없이 그 주소로 바로 붙을 수도 있다.
// 배포: .env.production의 VITE_API_BASE_URL(https://api.ajttk.com)로 백엔드를 직접 호출한다.
// CloudFront에 /api/* 라우팅 규칙이 없어 상대 경로가 실패하던 문제라 직접 호출로 전환.
// CORS: 백엔드가 https://ajttk.com을 허용 origin에 추가해야 한다(SecurityConfig.java
// corsConfigurationSource) - 프론트 코드로는 해결 불가한 영역이니 백엔드 쪽 확인 필요.
const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export const apiClient = axios.create({
  baseURL,
  // 백엔드 미연결 시 OS 레벨 연결 타임아웃(수 초)을 그대로 기다리면 모든 페이지가
  // mock으로 폴백하기 전까지 느려 보인다. 짧게 끊어서 mock 폴백이 빠르게 동작하게 한다.
  timeout: 1000,
})

// 요청 인터셉터: JWT 토큰을 헤더에 실어 보냄
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터: 401(인증 만료) 공통 처리
// 백엔드 에러 응답은 { errorCode, message } 형태로 내려온다. 여기서 별도로 가공하지 않고
// error.response를 그대로 reject하므로, 호출부에서 err.response?.data?.message /
// err.response?.data?.errorCode 로 그대로 꺼내 쓸 수 있다.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      // 필요 시 로그인 페이지로 리다이렉트 처리
    }
    return Promise.reject(error)
  }
)

export default apiClient
