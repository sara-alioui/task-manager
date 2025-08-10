const { execute, oracledb } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendPasswordSetupEmail } = require('../services/emailService');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

module.exports = {
  createUser: async (req, res) => {
    const transaction = await oracledb.getConnection();
    try {
      const { nom, email, role = 'utilisateur', phoneNumber } = req.body;

      if (!nom || !email) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Nom et email requis' });
      }

      const existingUser = await execute(
        `SELECT id FROM utilisateurs WHERE email = :email`,
        { email: email.toLowerCase() },
        { transaction }
      );

      if (existingUser.rows.length > 0) {
        await transaction.rollback();
        return res.status(409).json({ error: 'Email déjà utilisé' });
      }

      const result = await execute(
        `INSERT INTO utilisateurs (nom, email, role, phone_number, motdepasse) 
         VALUES (:nom, :email, :role, :phoneNumber, NULL)
         RETURNING id INTO :id`,
        {
          nom: nom.trim(),
          email: email.toLowerCase(),
          role,
          phoneNumber: phoneNumber?.trim() || null,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        },
        { transaction, autoCommit: false }
      );

      const userId = result.outBinds.id[0];

      const token = jwt.sign(
        { userId, email: email.toLowerCase(), purpose: 'password_setup' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await sendPasswordSetupEmail(email.toLowerCase(), token);
      await transaction.commit();
      
      return res.status(201).json({
        success: true,
        message: 'Utilisateur créé. Email envoyé.',
        data: { userId }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Erreur:', error);
      return res.status(500).json({
        success: false,
        error: error.message.includes('email') 
          ? 'Échec envoi email' 
          : 'Erreur serveur'
      });
    } finally {
      if (transaction) await transaction.close();
    }
  },

  setPassword: async (req, res) => {
    const transaction = await oracledb.getConnection();
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'Données invalides' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.purpose !== 'password_setup') {
        return res.status(400).json({ error: 'Token invalide' });
      }

      const user = await execute(
        `SELECT id FROM utilisateurs 
         WHERE id = :userId AND motdepasse IS NULL`,
        { userId: decoded.userId },
        { transaction }
      );

      if (!user.rows.length) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await execute(
        `UPDATE utilisateurs 
         SET motdepasse = :hashedPassword 
         WHERE id = :userId`,
        { hashedPassword, userId: decoded.userId },
        { transaction, autoCommit: true }
      );

      return res.json({ success: true, message: 'Mot de passe configuré' });

    } catch (error) {
      await transaction.rollback();
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Lien expiré' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({ error: 'Token invalide' });
      }

      console.error('Erreur:', error);
      return res.status(500).json({ error: 'Erreur serveur' });
    } finally {
      if (transaction) await transaction.close();
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const result = await execute(
        `SELECT id, nom, email, role, phone_number,
         CASE WHEN motdepasse IS NULL THEN 'Non configuré' ELSE 'Configuré' END as password_status
         FROM utilisateurs ORDER BY date_creation DESC`
      );

      return res.json({ success: true, data: result.rows });

    } catch (error) {
      console.error('Erreur:', error);
      return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  },

  deleteUser: async (req, res) => {
    const transaction = await oracledb.getConnection();
    try {
      const { id } = req.params;

      const userExists = await execute(
        `SELECT id FROM utilisateurs WHERE id = :id`,
        { id },
        { transaction }
      );

      if (!userExists.rows.length) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      await execute(
        'DELETE FROM utilisateurs WHERE id = :id',
        { id },
        { transaction, autoCommit: true }
      );

      return res.json({ success: true, message: 'Utilisateur supprimé' });

    } catch (error) {
      console.error('Erreur:', error);
      return res.status(500).json({ success: false, error: 'Erreur serveur' });
    } finally {
      if (transaction) await transaction.close();
    }
  },

  resendPasswordSetup: async (req, res) => {
    const transaction = await oracledb.getConnection();
    try {
      const { id } = req.params;

      const user = await execute(
        `SELECT id, email FROM utilisateurs WHERE id = :id AND motdepasse IS NULL`,
        { id },
        { transaction }
      );

      if (!user.rows.length) {
        return res.status(404).json({ error: 'Utilisateur non trouvé ou déjà configuré' });
      }

      const token = jwt.sign(
        { userId: user.rows[0].ID, email: user.rows[0].EMAIL, purpose: 'password_setup' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await sendPasswordSetupEmail(user.rows[0].EMAIL, token);

      return res.json({ success: true, message: 'Email renvoyé' });

    } catch (error) {
      console.error('Erreur:', error);
      return res.status(500).json({ success: false, error: 'Erreur serveur' });
    } finally {
      if (transaction) await transaction.close();
    }
  }
};