import http from 'k6/http';
import { check, sleep } from 'k6';

// Aggressive CPU stress test to trigger HPA
export const options = {
    stages: [
        { duration: '30s', target: 20 },  // Ramp up quickly
        { duration: '3m', target: 40 },   // Sustained load to trigger HPA
        { duration: '1m', target: 0 },    // Ramp down to see scale-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.20'], // Allow 20% for port-forward
    },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
    // Hit CPU stress endpoint - burns 50ms per request
    const res = http.get(`${BASE_URL}/api/stress-cpu`);
    check(res, {
        'stress endpoint works': (r) => r.status === 200,
    });

    // No sleep - hammer the endpoint to max out CPU
}
