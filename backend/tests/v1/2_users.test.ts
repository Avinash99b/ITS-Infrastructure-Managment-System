import request from 'supertest';
import app from '../../src/app';

describe('User Endpoints', () => {
  it('should require auth for /users', async () => {
    const res = await request(app).get('/api/v1/users');
    expect([401, 403]).toContain(res.status);
  });

  it('should require auth for /users/:userId/permissions', async () => {
    const res = await request(app).get('/api/v1/users/1/permissions');
    expect([401, 403]).toContain(res.status);
  });
  // Add more tests for authorized access as needed
});

