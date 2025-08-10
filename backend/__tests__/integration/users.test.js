const request = require('supertest');
const app = require('../../server');
const db = require('../../utils/db');

describe('Users API Integration Tests', () => {
  beforeAll(async () => {
    // Crée une table de test isolée
    await db.execute(`
      CREATE TABLE test_users AS 
      SELECT * FROM utilisateurs 
      WHERE 1=0
    `);
  });

  afterAll(async () => {
    // Nettoyage
    await db.execute('DROP TABLE test_users PURGE');
  });

  test('POST /api/users → 201 (Création valide)', async () => {
    const userData = {
      nom: "Test Professionnel",
      email: "pro@entreprise.com",
      password: "Secure123!"
    };

    const res = await request(app)
      .post('/api/users')
      .send(userData);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        id: expect.any(Number),
        email: userData.email
      }
    });
  });

  test('GET /api/users → 200 (Format standard)', async () => {
    const res = await request(app).get('/api/users');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: expect.any(Array),
      count: expect.any(Number)
    });
  });
});