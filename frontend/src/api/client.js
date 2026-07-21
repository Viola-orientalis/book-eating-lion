import axios from 'axios'

// 프록시 기반 라우팅만 허용 (Docker Nginx 프록시 또는 CloudFront 라우팅)
// CORS 문제를 원천 차단하기 위해 무조건 상대 경로("")만 사용합니다.
const baseURL = ''

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
