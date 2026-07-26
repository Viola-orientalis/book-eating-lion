import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // 최소한의 가상 유저(5명)로 1분간 정찰
  vus: 5,
  duration: '1m',
  
  // 성공 판정 임계치 (Smoke Test는 100% 성공이 목표)
  thresholds: {
    http_req_failed: ['rate==0.00'],     // 에러율 0% 필수
    http_req_duration: ['p(95)<200'],    // 상위 95% 응답속도 200ms 이하
  },
};

export default function () {
  const BASE_URL = 'https://api.ajttk.com'; // 💡 테스트할 백엔드 API 주소

  const res = http.get(`${BASE_URL}/actuator/health`);

  // 응답 검증
  check(res, {
    'HTTP 상태 코드 200 OK': (r) => r.status === 200,
    '응답 시간 200ms 이내': (r) => r.timings.duration < 200,
  });

  sleep(1); // 1초 간격으로 요청
}