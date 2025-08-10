const { execute, oracledb } = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
const JWT_EXPIRATION = process.env.JWT_EXPIRES_IN || '8h';

module.exports = {
  async register(req, res) {
    try {
      const { nom, email: rawEmail, password: rawPassword } = req.body;
      const email = rawEmail?.trim().toLowerCase();
      const password = rawPassword?.trim();

      if (!nom || !email || !password) {
        return res.status(400).json({ 
          message: 'Nom, email et mot de passe requis' 
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ 
          message: 'Le mot de passe doit contenir au moins 8 caractères' 
        });
      }

      // Logique de rôle admin
      let role = 'utilisateur';
      if (email === 'admin@example.com') {
        role = 'admin';
      }

      // Vérification de l'existence de l'email
      const userExists = await execute(
        `SELECT id FROM utilisateurs WHERE LOWER(email) = LOWER(:email)`,
        { email }
      );

      if (userExists.rows?.length > 0) {
        return res.status(409).json({ 
          message: 'Email déjà utilisé' 
        });
      }

      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Insertion en base
      const result = await execute(
        `INSERT INTO utilisateurs (nom, email, motdepasse, role, date_creation)
         VALUES (:nom, :email, :motdepasse, :role, SYSTIMESTAMP)
         RETURNING id INTO :id`,
        {
          nom: nom.trim(),
          email,
          motdepasse: hashedPassword,
          role,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        },
        { autoCommit: true }
      );

      // Génération du token JWT
      const token = jwt.sign(
        { 
          id: result.outBinds.id[0],
          email,
          role
        },
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
      );

      return res.status(201).json({
        token,
        user: {
          id: result.outBinds.id[0],
          nom,
          email,
          role
        }
      });

    } catch (err) {
      console.error('❌ Erreur inscription:', err);
      return res.status(500).json({
        message: 'Erreur lors de la création du compte'
      });
    }
  },

  async login(req, res) {
    try {
      console.log('🔍 Tentative de connexion:', { email: req.body.email });
      
      const { email: rawEmail, password: rawPassword } = req.body;
      const email = rawEmail?.trim().toLowerCase();
      const password = rawPassword?.trim();

      if (!email || !password) {
        return res.status(400).json({ 
          message: 'Email et mot de passe requis' 
        });
      }

      console.log('🔍 Recherche utilisateur:', email);
      const result = await execute(
        `SELECT id, nom, email, motdepasse, role
         FROM utilisateurs 
         WHERE LOWER(email) = LOWER(:email)`,
        { email }
      );

      const user = result.rows?.[0];
      console.log('🔍 Utilisateur trouvé:', !!user);

      if (!user) {
        return res.status(401).json({ 
          message: 'Identifiants invalides' 
        });
      }

      if (!user.MOTDEPASSE) {
        return res.status(400).json({ 
          message: 'Mot de passe non défini. Vérifiez votre email pour le lien de configuration.' 
        });
      }

      console.log('🔍 Vérification mot de passe...');
      const isValidPassword = await bcrypt.compare(password, user.MOTDEPASSE);
      console.log('🔍 Mot de passe valide:', isValidPassword);
      
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: 'Identifiants invalides' 
        });
      }

      // Génération du token JWT
      const token = jwt.sign(
        { 
          id: user.ID,
          email: user.EMAIL,
          role: user.ROLE
        },
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
      );

      console.log('✅ Connexion réussie pour:', user.EMAIL);

      return res.json({
        token,
        user: {
          id: user.ID,
          nom: user.NOM,
          email: user.EMAIL,
          role: user.ROLE
        }
      });

    } catch (err) {
      console.error('❌ Erreur connexion:', err);
      return res.status(500).json({
        message: 'Erreur serveur lors de la connexion'
      });
    }
  },

  async logout(req, res) {
    try {
      return res.json({ 
        message: 'Déconnexion réussie' 
      });
    } catch (err) {
      console.error('❌ Erreur déconnexion:', err);
      return res.status(500).json({
        message: 'Erreur lors de la déconnexion'
      });
    }
  },

  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
      if (!token) {
        return res.status(401).json({ valid: false });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await execute(
        `SELECT id, role FROM utilisateurs WHERE id = :id`,
        { id: decoded.id }
      );

      if (!user.rows?.length) {
        return res.status(401).json({ valid: false });
      }

      return res.json({ 
        valid: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          role: user.rows[0].ROLE
        }
      });
    } catch (err) {
      console.error('❌ Token invalide:', err);
      return res.status(401).json({ valid: false });
    }
  },

  async getCurrentUser(req, res) {
    try {
      console.log('🔍 getCurrentUser - req.user:', req.user);
      
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      const result = await execute(
        `SELECT id, nom, email, role, 
                TO_CHAR(date_creation, 'DD/MM/YYYY HH24:MI') AS date_creation
         FROM utilisateurs 
         WHERE id = :id`,
        { id: req.user.id }
      );

      const user = result.rows?.[0];
      if (!user) {
        return res.status(404).json({ 
          message: 'Utilisateur non trouvé' 
        });
      }

      return res.json({ 
        user: {
          id: user.ID,
          nom: user.NOM,
          email: user.EMAIL,
          role: user.ROLE,
          dateCreation: user.DATE_CREATION
        }
      });

    } catch (err) {
      console.error('❌ Erreur récupération utilisateur:', err);
      return res.status(500).json({
        message: 'Erreur serveur'
      });
    }
  }
};