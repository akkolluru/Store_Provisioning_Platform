import http from 'k6/http';
import { check, sleep } from 'k6';

// Optimized for port-forward: moderate load that triggers HPA without overwhelming connection
export const options = {
    stages: [
        { duration: '30s', target: 10 },  // Warm up
        { duration: '2m', target: 30 },   // Sustained load to trigger HPA
        { duration: '1m', target: 50 },   // Peak load
        { duration: '1m', target: 30 },   // Scale down
        { duration: '30s', target: 0 },   // Cool down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed: ['rate<0.10'], // Allow 10% error rate for port-forward
    },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
    const res = http.get(`${BASE_URL}/api/stores`);
    check(res, {
        'status is 200': (r) => r.status === 200,
        'response has data': (r) => r.body && r.body.length > 100,
    });

    sleep(0.5); // Reduce request rate to be port-forward friendly
}
