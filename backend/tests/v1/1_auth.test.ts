import request from 'supertest';
import app from '../../src/app';

const randomMobile = () => '900' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
const validPassword = 'Test@1234';

let testUser: { mobile_no: string; password: string };
let authToken: string;

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Register a random user
    testUser = { mobile_no: randomMobile(), password: validPassword };
  });

  it('should fail registration with missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ mobile_no: testUser.mobile_no });
    expect(res.status).toBe(400);
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, name: 'Test User' });
    expect(res.status).toBe(201);
  });

  it('should fail login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ mobile_no: 'wrong', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ mobile_no: testUser.mobile_no, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    authToken = res.body.token;
  });

  it('should get /me with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.mobile_no).toBe(testUser.mobile_no);
  });

  it('should fail /me with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });

  // You can export authToken for use in other test files if needed
});
