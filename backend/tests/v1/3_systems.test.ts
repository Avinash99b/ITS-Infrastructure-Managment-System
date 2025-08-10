import request from 'supertest';
import app from '../../src/app';

describe('Systems Endpoints', () => {
  it('should require auth for GET /systems', async () => {
    const res = await request(app).get('/api/v1/systems');
    expect([401, 403]).toContain(res.status);
  });

  it('should require auth for POST /systems', async () => {
    const res = await request(app)
      .post('/api/v1/systems')
      .send({});
    expect([401, 403]).toContain(res.status);
  });

  it('should require auth for PATCH /systems/:disk_serial_no', async () => {
    const res = await request(app)
      .patch('/api/v1/systems/ABC123456789')
      .send({ status: 'green' });
    expect([401, 403]).toContain(res.status);
  });
  // Add more tests for authorized access and valid/invalid data as needed
});

