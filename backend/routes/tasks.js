const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const authMiddleware = require('../middlewares/auth');

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING.replace('//', '')
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Accès réservé aux administrateurs' });
  }
  next();
};

function mapTask(row) {
  return {
    id: row.ID,
    titre: row.TITRE,
    description: row.DESCRIPTION,
    statut: row.STATUT,
    utilisateurId: row.UTILISATEUR_ID,
    dateCreation: row.DATE_CREATION,
    dateEcheance: row.DATE_ECHEANCE,
    groupeId: row.GROUPE_ID
  };
}

// Route pour les tâches de l'utilisateur connecté
router.get('/mes-taches', authMiddleware, async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    connection = await oracledb.getConnection(dbConfig);
    
    // ✅ Récupérer les tâches assignées directement OU via un groupe
    const result = await connection.execute(
      `SELECT DISTINCT t.*, g.NOM as GROUPE_NOM, u.NOM as UTILISATEUR_NOM
       FROM TACHES t
       LEFT JOIN GROUPES g ON t.GROUPE_ID = g.ID
       LEFT JOIN UTILISATEURS u ON t.UTILISATEUR_ID = u.ID
       LEFT JOIN UTILISATEURS_GROUPES ug ON t.GROUPE_ID = ug.GROUPE_ID
       WHERE t.UTILISATEUR_ID = :userId 
       OR ug.UTILISATEUR_ID = :userId
       ORDER BY t.DATE_CREATION DESC`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const tasks = result.rows.map(row => ({
      ...mapTask(row),
      groupe: row.GROUPE_NOM,
      utilisateurNom: row.UTILISATEUR_NOM
    }));
    
    console.log(`✅ Tâches trouvées pour utilisateur ${userId}:`, tasks.length);
    res.json({ success: true, tasks });
    
  } catch (err) {
    console.error('❌ Erreur récupération mes tâches:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  } finally {
    if (connection) await connection.close();
  }
});

// Route admin pour toutes les tâches
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT t.*, g.NOM as GROUPE_NOM, u.NOM as UTILISATEUR_NOM
       FROM TACHES t
       LEFT JOIN GROUPES g ON t.GROUPE_ID = g.ID
       LEFT JOIN UTILISATEURS u ON t.UTILISATEUR_ID = u.ID
       ORDER BY t.DATE_CREATION DESC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const tasks = result.rows.map(row => ({
      ...mapTask(row),
      groupe: row.GROUPE_NOM,
      utilisateurNom: row.UTILISATEUR_NOM
    }));
    
    console.log(`✅ Total tâches récupérées (admin):`, tasks.length);
    res.json({ success: true, tasks });
    
  } catch (err) {
    console.error('❌ Erreur récupération toutes tâches:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  } finally {
    if (connection) await connection.close();
  }
});

// ✅ CRÉATION DE TÂCHE CORRIGÉE - Flexible pour utilisateur, groupe ou les deux
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  const { titre, description, utilisateurId, dateEcheance, groupeId } = req.body;
  
  console.log('🟡 Données reçues dans la route POST:', req.body);
  
  // ✅ Validation du titre uniquement
  if (!titre || titre.trim().length < 3) {
    return res.status(400).json({ 
      success: false, 
      error: 'Titre requis (minimum 3 caractères)' 
    });
  }

  // ✅ Au moins un assigné requis (utilisateur OU groupe OU les deux)
  if (!utilisateurId && !groupeId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Au moins un assigné requis (utilisateur ou groupe)' 
    });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // ✅ Vérification de l'utilisateur si fourni
    if (utilisateurId) {
      const userCheck = await connection.execute(
        `SELECT ID FROM UTILISATEURS WHERE ID = :userId`,
        { userId: utilisateurId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Utilisateur avec l'ID ${utilisateurId} non trouvé`
        });
      }
      console.log('✅ Utilisateur vérifié:', utilisateurId);
    }

    // ✅ Vérification du groupe si fourni
    if (groupeId) {
      const groupCheck = await connection.execute(
        `SELECT ID, NOM FROM GROUPES WHERE ID = :groupeId`,
        { groupeId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      if (groupCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Groupe avec l'ID ${groupeId} non trouvé`
        });
      }
      console.log('✅ Groupe vérifié:', groupCheck.rows[0].NOM);
    }

    // ✅ Insertion de la tâche avec assignation flexible
    const insertResult = await connection.execute(
      `INSERT INTO TACHES (TITRE, DESCRIPTION, STATUT, UTILISATEUR_ID, DATE_CREATION, DATE_ECHEANCE, GROUPE_ID)
       VALUES (:titre, :description, 'A_FAIRE', :utilisateurId, SYSDATE, :dateEcheance, :groupeId)
       RETURNING ID INTO :id`,
      { 
        titre: titre.trim(), 
        description: description ? description.trim() : null, 
        utilisateurId: utilisateurId || null,
        dateEcheance: dateEcheance || null,
        groupeId: groupeId || null,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      },
      { autoCommit: true }
    );

    const taskId = insertResult.outBinds.id[0];
    
    console.log('✅ Tâche créée avec succès:', {
      id: taskId,
      titre: titre.trim(),
      utilisateurId,
      groupeId
    });

    res.status(201).json({ 
      success: true, 
      message: 'Tâche créée avec succès',
      data: {
        id: taskId,
        titre: titre.trim(),
        description: description ? description.trim() : null,
        statut: 'A_FAIRE',
        utilisateurId: utilisateurId || null,
        groupeId: groupeId || null,
        dateEcheance: dateEcheance || null
      }
    });

  } catch (err) {
    console.error('❌ Erreur création tâche:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la création: ' + err.message 
    });
  } finally {
    if (connection) await connection.close();
  }
});

// ✅ MISE À JOUR DE TÂCHE AMÉLIORÉE
router.patch('/:id', authMiddleware, async (req, res) => {
  const taskId = req.params.id;
  const { statut, titre, description } = req.body;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  if (!statut && !titre && !description) {
    return res.status(400).json({ 
      success: false, 
      error: 'Au moins un champ à mettre à jour requis' 
    });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // ✅ Vérification des permissions
    if (!isAdmin) {
      const permissionCheck = await connection.execute(
        `SELECT COUNT(*) as COUNT FROM TACHES t
         LEFT JOIN UTILISATEURS_GROUPES ug ON t.GROUPE_ID = ug.GROUPE_ID
         WHERE t.ID = :taskId 
         AND (t.UTILISATEUR_ID = :userId OR ug.UTILISATEUR_ID = :userId)`,
        { taskId, userId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      if (permissionCheck.rows[0].COUNT === 0) {
        return res.status(403).json({
          success: false,
          error: 'Non autorisé à modifier cette tâche'
        });
      }
    }

    // ✅ Construction de la requête de mise à jour
    let updateQuery = 'UPDATE TACHES SET ';
    let updateParams = { taskId };
    let updateFields = [];

    if (statut) {
      updateFields.push('STATUT = :statut');
      updateParams.statut = statut;
    }
    if (titre) {
      updateFields.push('TITRE = :titre');
      updateParams.titre = titre.trim();
    }
    if (description !== undefined) {
      updateFields.push('DESCRIPTION = :description');
      updateParams.description = description ? description.trim() : null;
    }

    updateQuery += updateFields.join(', ') + ' WHERE ID = :taskId';

    const result = await connection.execute(updateQuery, updateParams, { autoCommit: true });
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    console.log('✅ Tâche mise à jour:', taskId);
    res.json({ success: true, message: 'Tâche mise à jour avec succès' });

  } catch (err) {
    console.error('❌ Erreur mise à jour tâche:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  } finally {
    if (connection) await connection.close();
  }
});

// ✅ SUPPRESSION DE TÂCHE AVEC PERMISSIONS
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const taskId = req.params.id;
  let connection;
  
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    // Vérifier si la tâche existe
    const checkResult = await connection.execute(
      `SELECT TITRE FROM TACHES WHERE ID = :taskId`,
      { taskId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    const taskTitle = checkResult.rows[0].TITRE;

    // Suppression
    await connection.execute(
      `DELETE FROM TACHES WHERE ID = :taskId`,
      { taskId },
      { autoCommit: true }
    );

    console.log('✅ Tâche supprimée:', taskTitle);
    res.json({ 
      success: true, 
      message: `Tâche "${taskTitle}" supprimée avec succès` 
    });

  } catch (err) {
    console.error('❌ Erreur suppression tâche:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  } finally {
    if (connection) await connection.close();
  }
});

// ✅ ROUTE BONUS - Statistiques des tâches
router.get('/stats', authMiddleware, async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    connection = await oracledb.getConnection(dbConfig);
    
    let query;
    let params;
    
    if (isAdmin) {
      query = `
        SELECT 
          COUNT(*) as TOTAL,
          SUM(CASE WHEN STATUT = 'A_FAIRE' THEN 1 ELSE 0 END) as A_FAIRE,
          SUM(CASE WHEN STATUT = 'EN_COURS' THEN 1 ELSE 0 END) as EN_COURS,
          SUM(CASE WHEN STATUT = 'TERMINE' THEN 1 ELSE 0 END) as TERMINE,
          SUM(CASE WHEN UTILISATEUR_ID IS NOT NULL THEN 1 ELSE 0 END) as ASSIGNEES_USER,
          SUM(CASE WHEN GROUPE_ID IS NOT NULL THEN 1 ELSE 0 END) as ASSIGNEES_GROUP
        FROM TACHES
      `;
      params = [];
    } else {
      query = `
        SELECT 
          COUNT(DISTINCT t.ID) as TOTAL,
          SUM(CASE WHEN t.STATUT = 'A_FAIRE' THEN 1 ELSE 0 END) as A_FAIRE,
          SUM(CASE WHEN t.STATUT = 'EN_COURS' THEN 1 ELSE 0 END) as EN_COURS,
          SUM(CASE WHEN t.STATUT = 'TERMINE' THEN 1 ELSE 0 END) as TERMINE
        FROM TACHES t
        LEFT JOIN UTILISATEURS_GROUPES ug ON t.GROUPE_ID = ug.GROUPE_ID
        WHERE t.UTILISATEUR_ID = :userId OR ug.UTILISATEUR_ID = :userId
      `;
      params = { userId };
    }
    
    const result = await connection.execute(query, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error('❌ Erreur récupération statistiques:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  } finally {
    if (connection) await connection.close();
  }
});

module.exports = router;