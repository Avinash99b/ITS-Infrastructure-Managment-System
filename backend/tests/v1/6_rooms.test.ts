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

    describe('Paging and Filtering', () => {
        let blockId2: number;
        let userId2: number;
        beforeAll(async () => {
            // Create another block
            const blockRes = await db('blocks').insert({name: 'Block 2', description: 'Second block'}).returning('id');
            blockId2 = blockRes[0].id as number;
            // Create another user
            const userRes = await db('users').insert({
                name: 'User2',
                mobile_no: '9999999999',
                password_hash: 'Test@123',
                email:'temp@gmail.com'
            }).returning('id');
            userId2 = userRes[0].id as number;
            // Create rooms with various combinations
            await db('rooms').insert([
                {name: 'RoomA', block_id: blockId, floor: 1, incharge_id: userModel.id},
                {name: 'RoomB', block_id: blockId, floor: 2, incharge_id: userId2},
                {name: 'RoomC', block_id: blockId2, floor: 1, incharge_id: userModel.id},
                {name: 'RoomD', block_id: blockId2, floor: 2, incharge_id: null},
                {name: 'RoomE', block_id: blockId2, floor: 3, incharge_id: userId2},
            ]);
        });

        it('GET /api/v1/rooms - should return paginated rooms', async () => {
            const res = await request(app).get('/api/v1/rooms?limit=2&page=1');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('page');
            expect(res.body).toHaveProperty('limit');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeLessThanOrEqual(2);
        });

        it('GET /api/v1/rooms - should return next page', async () => {
            const res = await request(app).get('/api/v1/rooms?limit=2&page=2');
            expect(res.status).toBe(200);
            expect(res.body.page).toBe(2);
            expect(res.body.data.length).toBeLessThanOrEqual(2);
        });

        it('GET /api/v1/rooms - should filter by block_id', async () => {
            const res = await request(app).get(`/api/v1/rooms?block_id=${blockId2}`);
            expect(res.status).toBe(200);
            expect(res.body.data.every((r: { block_id: number; }) => r.block_id === blockId2)).toBe(true);
        });

        it('GET /api/v1/rooms - should filter by floor', async () => {
            const res = await request(app).get('/api/v1/rooms?floor=1');
            expect(res.status).toBe(200);
            expect(res.body.data.every((r: { floor: number; }) => r.floor === 1)).toBe(true);
        });

        it('GET /api/v1/rooms - should filter by incharge_id', async () => {
            const res = await request(app).get(`/api/v1/rooms?incharge_id=${userModel.id}`);
            expect(res.status).toBe(200);
            expect(res.body.data.every((r: { incharge_id: number; }) => r.incharge_id === userModel.id)).toBe(true);
        });

        it('GET /api/v1/rooms - should filter by block_id and floor', async () => {
            const res = await request(app).get(`/api/v1/rooms?block_id=${blockId2}&floor=3`);
            expect(res.status).toBe(200);
            expect(res.body.data.every((r: { block_id: number; floor: number; }) => r.block_id === blockId2 && r.floor === 3)).toBe(true);
        });

        it('GET /api/v1/rooms - should return empty for non-existent filter', async () => {
            const res = await request(app).get('/api/v1/rooms?block_id=9999');
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(0);
        });
    });
});
