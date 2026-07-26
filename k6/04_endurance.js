import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },  // 1분간 100 VU까지 워밍업
    { duration: '13m', target: 100 }, // 13분간 100 VU 부하 지속 유지 (총 15분)
    { duration: '1m', target: 0 },    // 1분간 부하 서서히 감소 (쿨다운)
  ],
  
  thresholds: {
    http_req_failed: ['rate<0.001'],   // 에러율 0.1% 미만 유지 조건
    http_req_duration: ['p(95)<300'],   // p95 응답속도 300ms 이내 유지
  },
};

export default function () {
  const BASE_URL = 'https://api.ajttk.com';

  const res = http.get(`${BASE_URL}/health`);

  check(res, {
    'HTTP 상태 코드 200 OK': (r) => r.status === 200,
    '응답 시간 300ms 이내': (r) => r.timings.duration < 300,
  });

  sleep(1);
}