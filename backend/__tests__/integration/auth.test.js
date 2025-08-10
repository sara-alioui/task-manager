const request = require('supertest');
const app = require('../../server');
const db = require('../../db');
const bcrypt = require('bcryptjs');

describe('Auth API Integration Tests', () => {
  const testUser = {
    nom: "Test Auth",
    email: "auth.test@taskmanager.com",
    password: "SecurePassword123!"
  };

  beforeAll(async () => {
    // Création d'un utilisateur de test
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await db.execute(
      `INSERT INTO test_users (nom, email, password) 
       VALUES (:1, :2, :3)`,
      [testUser.nom, testUser.email, hashedPassword]
    );
  });

  afterAll(async () => {
    // Nettoyage
    await db.execute("DELETE FROM test_users WHERE email LIKE 'auth.test%'");
  });

  describe('POST /api/auth/login', () => {
    test('200 → Connexion réussie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        token: expect.any(String),
        user: {
          email: testUser.email
        }
      });
    });

    test('401 → Mot de passe incorrect', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: "faux_mot_de_passe"
        });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        error: "Identifiants invalides"
      });
    });

    test('400 → Email manquant', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: "123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch("Email requis");
    });
  });

  describe('POST /api/auth/register', () => {
    const newUser = {
      nom: "Nouvel Utilisateur",
      email: "new.user@taskmanager.com",
      password: "NewPassword123!"
    };

    afterEach(async () => {
      await db.execute(
        "DELETE FROM test_users WHERE email = :1", 
        [newUser.email]
      );
    });

    test('201 → Création compte réussie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        success: true,
        user: {
          email: newUser.email
        }
      });
    });

    test('409 → Email déjà utilisé', async () => {
      // Premier enregistrement
      await request(app).post('/api/auth/register').send(newUser);
      
      // Tentative doublon
      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch("déjà utilisé");
    });

    test('400 → Mot de passe faible', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...newUser,
          password: "123"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch("au moins 8 caractères");
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeAll(async () => {
      // Obtenir un token valide
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      authToken = loginRes.body.token;
    });

    test('200 → Récupération profil', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        email: testUser.email
      });
    });

    test('401 → Token invalide', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_invalide');

      expect(res.status).toBe(401);
    });
  });
});