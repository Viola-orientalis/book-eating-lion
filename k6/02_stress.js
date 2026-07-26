import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 }, // 1분간 100 VU까지 워밍업
    { duration: '2m', target: 100 }, // 100 VU 유지 (기본 부하)
    { duration: '1m', target: 300 }, // 300 VU로 증폭
    { duration: '2m', target: 300 }, // 300 VU 유지
    { duration: '1m', target: 500 }, // 500 VU로 한계 시험
    { duration: '2m', target: 500 }, // 500 VU 유지
    { duration: '1m', target: 800 }, // 800 VU 극상 부하
    { duration: '2m', target: 800 }, // 800 VU 유지
    { duration: '1m', target: 0 },   // 부하 쿨다운
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // 에러율 1% 미만 유지 조건
    http_req_duration: ['p(95)<1000'], // 상위 95% 응답속도가 1초 이내일 것
  },
};

export default function () {
  // 💡 실제 테스트할 API 엔드포인트로 변경하시옵소서
  const BASE_URL = 'https://api.ajttk.com'; 
  
  const res = http.get(`${BASE_URL}/health`); // 또는 핵심 조회 API
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1); // 유저 요청 간격 (1초)
}