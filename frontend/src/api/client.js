import axios from 'axios'

// 백엔드(오현님) Spring Boot API 주소.
// 로컬 개발 시 .env.local 에 VITE_API_BASE_URL=http://localhost:8080 형태로 지정
// 배포 시 EC2 도메인/IP + 포트로 교체
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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
