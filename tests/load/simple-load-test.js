import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 },  // Ramp up to 20 users
        { duration: '1m', target: 50 },   // Ramp up to 50 users  
        { duration: '30s', target: 100 }, // Spike to 100 users
        { duration: '1m', target: 50 },   // Back down to 50
        { duration: '30s', target: 0 },   // Ramp down to 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
        http_req_failed: ['rate<0.05'],    // Error rate under 5%
    },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
    // Test 1: GET all stores
    const listRes = http.get(`${BASE_URL}/api/stores`);
    check(listRes, {
        'list stores status is 200': (r) => r.status === 200,
        'list stores has response': (r) => r.body.length > 0,
    });

    sleep(1);

    // Test 2: Health check
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
        'health check status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
