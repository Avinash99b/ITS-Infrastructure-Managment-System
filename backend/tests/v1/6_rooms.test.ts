import request from 'supertest';
import app from '../../src/app';
import db from "../../src/components/db";
import {ResponseUserModel} from "../../src/models/userModel";
import {Knex} from "knex";

let authToken: string;
let createdRoomId: number;

const testRoom = {
    name: 'Conference Room',
    description: 'Main conference room',
    incharge_id: null,
    floor: 2
};

let blockId: number;

let userModel:ResponseUserModel
beforeAll(async () => {
    // Login as test user
    const res = await request(app)
        .post('/api/v1/auth/login')
        .send({mobile_no: '1234567890', password: 'Desktop@9502'});
    authToken = res.body.token;

    if (!authToken) {
        console.log(res.body)
    }
    console.log('Auth token received:', authToken);
    // Create a block to associate with the room
    const result = await db('blocks').insert({name: 'Test Block', description: 'Block for testing'}).returning('id')
    blockId = result[0].id as number;
    console.log('Block created with ID:', blockId);

    // Fetch user model to get permissions
    const userRes = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`);
    userModel = userRes.body;
    console.log('User model fetched:', userModel);
});

describe('Rooms Endpoints', () => {
    it('GET /api/v1/rooms - should return all rooms', async () => {
        const res = await request(app).get('/api/v1/rooms');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/v1/rooms - should create a room without incharge', async () => {
        const res = await request(app)
            .post('/api/v1/rooms')
            .set('Authorization', `Bearer ${authToken}`)
            .send({...testRoom, block_id: blockId});
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        createdRoomId = res.body.id;
    });

    it('POST /api/v1/rooms - should create a room with incharge', async () => {
        const res = await request(app)
            .post('/api/v1/rooms')
            .set('Authorization', `Bearer ${authToken}`)
            .send({...testRoom, incharge_id: userModel.id, block_id: blockId});
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        createdRoomId = res.body.id;
    });

    it('POST /api/v1/rooms - should fail with wrong lab incharge', async () => {
        const res = await request(app)
            .post('/api/v1/rooms')
            .set('Authorization', `Bearer ${authToken}`)
            .send({...testRoom, incharge_id: 9999999, block_id: blockId});
        expect(res.status).toBe(400);
    });

    it('GET /api/v1/rooms/:id - should get room by id', async () => {
        const res = await request(app).get(`/api/v1/rooms/${createdRoomId}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(createdRoomId);
    });

    it('PATCH /api/v1/rooms/:id - should update room', async () => {
        const res = await request(app)
            .patch(`/api/v1/rooms/${createdRoomId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({name: 'Updated Room'});
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated Room');
    });

    it('DELETE /api/v1/rooms/:id - should delete room', async () => {
        const res = await request(app)
            .delete(`/api/v1/rooms/${createdRoomId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('GET /api/v1/rooms/:id - should return 404 for deleted room', async () => {
        const res = await request(app).get(`/api/v1/rooms/${createdRoomId}`);
        expect(res.status).toBe(404);
    });

    it('POST /api/v1/rooms - should fail validation', async () => {
        const res = await request(app)
            .post('/api/v1/rooms')
            .set('Authorization', `Bearer ${authToken}`)
            .send({name: ''});
        expect(res.status).toBe(400);
    });

    it('PATCH /api/v1/rooms/:id - should return 404 for non-existent room', async () => {
        const res = await request(app)
            .patch('/api/v1/rooms/999999')
            .set('Authorization', `Bearer ${authToken}`)
            .send({name: 'No Room'});
        expect(res.status).toBe(404);
    });

    it('DELETE /api/v1/rooms/:id - should return 404 for non-existent room', async () => {
        const res = await request(app)
            .delete('/api/v1/rooms/999999')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(404);
    });

    it('POST /api/v1/rooms - should fail without token', async () => {
        const res = await request(app)
            .post('/api/v1/rooms')
            .send(testRoom);
        expect(res.status).toBe(401);
    });

    it('PATCH /api/v1/rooms/:id - should fail without token', async () => {
        const res = await request(app)
            .patch(`/api/v1/rooms/${createdRoomId}`)
            .send({name: 'No Auth'});
        expect(res.status).toBe(401);
    });

    it('DELETE /api/v1/rooms/:id - should fail without token', async () => {
        const res = await request(app)
            .delete(`/api/v1/rooms/${createdRoomId}`);
        expect(res.status).toBe(401);
    });
});

