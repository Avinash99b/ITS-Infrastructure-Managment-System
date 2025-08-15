import request from 'supertest';
import app from '../../src/app';
import db from '../../src/components/db';

// Replicate randomMobile and validPassword logic from 1_auth.test.ts
const randomMobile = () => '900' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
const validMobile = "1234567890"; // Replace with a valid mobile number for your tests
const validPassword = 'Desktop@9502';

// Use the same test user as 1_auth.test.ts
let testUser: { mobile_no: string; password: string, name: string, email: string };
let token: string;
let createdBlockId: number;

const BASE_URL = '/api/v1/blocks';

describe('Blocks API', () => {
    beforeAll(async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ mobile_no: validMobile, password: validPassword });
        token = res.body.token;
        // Clean up blocks table
        await db('blocks').del();
    });

    it('should fail to create a block without auth', async () => {
        const res = await request(app)
            .post(BASE_URL)
            .send({ name: 'NoAuthBlock' });
        expect(res.status).toBe(401);
    });

    it('should create a block (POST /blocks)', async () => {
        const res = await request(app)
            .post(BASE_URL)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Test Block',
                description: 'A block for testing',
                image_url: 'http://example.com/image.png'
            });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('Test Block');
        createdBlockId = res.body.id;
    });

    it('should fail to create a block with invalid payload', async () => {
        const res = await request(app)
            .post(BASE_URL)
            .set('Authorization', `Bearer ${token}`)
            .send({ description: 'Missing name' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('should get all blocks (GET /blocks)', async () => {
        const res = await request(app).get(BASE_URL);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should get a block by id (GET /blocks/:id)', async () => {
        const res = await request(app).get(`${BASE_URL}/${createdBlockId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', createdBlockId);
    });

    it('should return 404 for non-existing block (GET /blocks/:id)', async () => {
        const res = await request(app).get(`${BASE_URL}/999999`);
        expect(res.status).toBe(404);
    });

    it('should fail to update a block without auth', async () => {
        const res = await request(app)
            .put(`${BASE_URL}/${createdBlockId}`)
            .send({ name: 'NoAuthUpdate' });
        expect(res.status).toBe(401);
    });

    it('should update a block (PUT /blocks/:id)', async () => {
        const res = await request(app)
            .put(`${BASE_URL}/${createdBlockId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Updated Block' });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated Block');
    });

    it('should fail to update a block with invalid payload', async () => {
        const res = await request(app)
            .put(`${BASE_URL}/${createdBlockId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ image_url: 'not-a-url' });
        expect(res.status).toBe(400);
    });

    it('should return 404 for updating non-existing block', async () => {
        const res = await request(app)
            .put(`${BASE_URL}/999999`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'No Block' });
        expect(res.status).toBe(404);
    });

    it('should fail to delete a block without auth', async () => {
        const res = await request(app)
            .delete(`${BASE_URL}/${createdBlockId}`);
        expect(res.status).toBe(401);
    });

    it('should delete a block (DELETE /blocks/:id)', async () => {
        const res = await request(app)
            .delete(`${BASE_URL}/${createdBlockId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(204);
    });

    it('should return 404 for deleting non-existing block', async () => {
        const res = await request(app)
            .delete(`${BASE_URL}/999999`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });

    afterAll(()=>{
        // Clean up blocks table after tests
        return db('blocks').del();
    })
});
