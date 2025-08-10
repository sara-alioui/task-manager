const request = require('supertest');
const app = require('../../server');
const db = require('../../db');

describe('Tasks API Integration Tests', () => {
  let testUserId;

  beforeAll(async () => {
    // Setup test data
    const [user] = await db.execute(`
      INSERT INTO test_users (nom, email, password) 
      VALUES ('Test User', 'test@taskmanager.com', 'password') 
      RETURNING id
    `);
    testUserId = user.id;
  });

  test('POST /api/tasks → 201 (Création tâche)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({
        title: "Tâche de test",
        user_id: testUserId,
        due_date: new Date().toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Tâche de test",
      completed: false
    });
  });

  test('GET /api/tasks → 200 (Filtres valides)', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .query({ user_id: testUserId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({
          title: expect.any(String)
        })
      ])
    });
  });
});