import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },  // 平時 평온한 상태
    { duration: '10s', target: 500 }, // 10초 만에 500명 기습 폭주!
    { duration: '3m', target: 500 },  // 500명 유지
    { duration: '10s', target: 0 },   // 즉시 부하 제거
  ],
};

export default function () {
  const BASE_URL = 'https://api.ajttk.com';
  const res = http.get(`${BASE_URL}/actuator/health`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}