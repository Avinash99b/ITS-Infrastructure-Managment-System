import request from 'supertest';
import app from '../../src/app';

const randomMobile = () => '900' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
const validPassword = 'Test@1234';

let testUser: { mobile_no: string; password: string, name: string, email: string };
let authToken: string;

describe('Auth Endpoints', () => {
    beforeAll(async () => {
        // Register a random user
        testUser = {
            mobile_no: randomMobile(),
            password: validPassword,
            name: 'Test User',
            email: '' + randomMobile() + '@example.com'
        };
    });

    it('should fail registration with missing fields', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({mobile_no: testUser.mobile_no});
        expect(res.status).toBe(400);
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({...testUser, name: 'Test User'});
        expect(res.status).toBe(201);
    });

    it('should fail registration with duplicate mobile_no', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({...testUser, name: 'Test User'});
        expect([400, 409]).toContain(res.status);
    });

    it('should fail registration with invalid password format', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({mobile_no: randomMobile(), password: '123', name: 'Bad Password'});
        expect(res.status).toBe(400);
    });

    it('should fail login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({mobile_no: 'wrong', password: 'wrong'});
        expect(res.status).toBe(400);
    });

    it('should login with correct credentials', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({mobile_no: testUser.mobile_no, password: testUser.password});
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        authToken = res.body.token;
    });

    it('should get /me with valid token', async () => {
        const res = await request(app)
            .get('/api/v1/users/me')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.mobile_no).toBe(testUser.mobile_no);
    });

    it('should fail /me with invalid token', async () => {
        const res = await request(app)
            .get('/api/v1/users/me')
            .set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(401);
    });

    it('should fail login for inactive user', async () => {
        // Assuming inactive user means not registered or deactivated
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({mobile_no: '9999999999', password: 'Test@1234'});
        expect([401, 403]).toContain(res.status);
    });

    // You can export authToken for use in other test files if needed
});

let adminToken: string;
const adminUser = {mobile_no: '1234567890', password: 'Desktop@9502'};
const permissionsToTest = [
    {name: 'view_users', description: 'Permission to view users'},
    {name: 'edit_users', description: 'Permission to edit users'},
    {name: 'delete_users', description: 'Permission to delete users'},
    {name: 'edit_roles', description: 'Permission to edit roles'},
    {name: 'edit_systems', description: 'Permission to edit systems'},
    {name: 'view_faults', description: 'Permission to view faults'},
    {name: 'edit_faults', description: 'Permission to edit faults'},
    {name: '*', description: 'All permissions, use with caution'},
    {
        name: 'grant_permissions',
        description: 'Permission to grant permissions to users except self and wildcard (*)'
    },
].map((p) => p.name);

describe('Admin Permission Management', () => {
    it('should login as admin', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send(adminUser);
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        adminToken = res.body.token;
    });

    permissionsToTest.forEach((perm) => {
        it(`should grant permission: ${perm}`, async () => {
            const res = await request(app)
                .patch('/api/v1/users/permissions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({userMobileNo: testUser.mobile_no, permissionsToKeep: [perm]});
            expect([200, 201]).toContain(res.status);
            expect(res.body.success).toBe(true);
        });
    });

    it('should revoke a permission', async () => {
        const res = await request(app)
            .patch('/api/v1/users/permissions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({userMobileNo: testUser.mobile_no, permissionsToKeep: []});
        expect([200, 201]).toContain(res.status);
        expect(res.body.success).toBe(true);
    });

    it('should fail to grant permission with invalid token', async () => {
        const res = await request(app)
            .patch('/api/v1/users/permissions')
            .set('Authorization', 'Bearer invalidtoken')
            .send({mobile_no: testUser.mobile_no, permissions: ['view_users']});
        expect(res.status).toBe(401);
    });

    it('should fail to grant permission with invalid permission', async () => {
        const res = await request(app)
            .patch('/api/v1/users/permissions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({mobile_no: testUser.mobile_no, permissions: ['invalid_permission']});
        expect(res.status).toBe(400);
    });

    it('should fail to grant permission with missing fields', async () => {
        const res = await request(app)
            .patch('/api/v1/users/permissions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({permissions: ['view_users']}); // missing mobile_no
        expect(res.status).toBe(400);
    });

    it('should fail to update permissions for non-existent user', async () => {
        const res = await request(app)
            .patch('/api/v1/users/permissions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({mobile_no: '0000000000', permissions: ['view_users']});
        expect([400, 404]).toContain(res.status);
    });

    it('should fail to update permissions with empty permissions array', async () => {
        const res = await request(app)
            .patch('/api/v1/users/permissions')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({mobile_no: adminUser.mobile_no, permissions: []});
        expect(res.status).toBe(400);
    });
});
