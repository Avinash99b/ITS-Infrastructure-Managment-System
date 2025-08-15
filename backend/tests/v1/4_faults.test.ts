import request from 'supertest';
import app from '../../src/app';

describe('Faults Endpoints', () => {
  it('should require auth for GET /faults', async () => {
    const res = await request(app).get('/api/v1/faults');
    console.log(res.body,res.status)
    expect([401, 403]).toContain(res.status);
  });

  it('should require auth for POST /faults', async () => {
    const res = await request(app)
      .post('/api/v1/faults')
      .send({});
    expect([401, 403]).toContain(res.status);
  });
  // Add more tests for authorized access and valid/invalid data as needed
});
