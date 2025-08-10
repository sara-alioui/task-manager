const { execute, oracledb } = require('../db');

module.exports = {
  async getAvailableUsers(req, res) {
    try {
      const result = await execute(
        `SELECT id, nom, email FROM utilisateurs ORDER BY nom ASC`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      const users = result.rows?.map(row => ({
        id: row.ID,
        nom: row.NOM,
        email: row.EMAIL
      })) || [];
      
      return res.json({ success: true, users });
    } catch (err) {
      console.error('Erreur getAvailableUsers:', err);
      return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des utilisateurs' });
    }
  },

  async create(req, res) {
    let connection;
    try {
      const { nom, description, membres = [] } = req.body;

      if (!nom || nom.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Nom invalide (minimum 3 caractères)' });
      }
      
      if (!req.user?.id) {
        return res.status(401).json({ success: false, error: 'Utilisateur non authentifié' });
      }

      const validMembres = membres.map(id => parseInt(id)).filter(id => !isNaN(id));

      connection = await oracledb.getConnection();

      // Vérification des membres existants
      for (const membreId of validMembres) {
        const userExists = await execute(
          `SELECT 1 FROM utilisateurs WHERE id = :membreId`, 
          { membreId }, 
          { connection }
        );
        if (!userExists.rows.length) {
          throw new Error(`Utilisateur ID ${membreId} non trouvé`);
        }
      }

      // Création du groupe
      const groupResult = await execute(
        `INSERT INTO groupes (nom, description, createur_id, date_creation)
         VALUES (:nom, :description, :createurId, SYSTIMESTAMP)
         RETURNING id INTO :id`,
        { 
          nom: nom.trim(), 
          description: description?.trim() || null, 
          createurId: req.user.id, 
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } 
        },
        { connection }
      );

      const groupeId = groupResult.outBinds.id[0];

      // Ajout du créateur comme membre
      await execute(
        `INSERT INTO UTILISATEURS_GROUPES (groupe_id, utilisateur_id, date_ajout)
         VALUES (:groupeId, :utilisateurId, SYSTIMESTAMP)`,
        { groupeId, utilisateurId: req.user.id },
        { connection }
      );

      // Ajout des autres membres
      for (const membreId of validMembres) {
        await execute(
          `INSERT INTO UTILISATEURS_GROUPES (groupe_id, utilisateur_id, date_ajout)
           VALUES (:groupeId, :utilisateurId, SYSTIMESTAMP)`,
          { groupeId, utilisateurId: membreId },
          { connection }
        );
      }

      await connection.commit();

      res.status(201).json({ 
        success: true, 
        data: { 
          id: groupeId, 
          nom: nom.trim(), 
          description: description?.trim() || '', 
          createur_id: req.user.id
        } 
      });

    } catch (err) {
      if (connection) await connection.rollback();
      
      let errorMessage = 'Erreur création groupe';
      if (err.message.includes('ORA-02291')) {
        errorMessage = 'Référence invalide dans la base de données';
      } else if (err.message.includes('Utilisateur ID')) {
        errorMessage = err.message;
      } else if (err.message.includes('ORA-')) {
        errorMessage = 'Erreur base de données: ' + err.message;
      }
      
      res.status(500).json({ success: false, error: errorMessage });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeErr) {
          console.error('Erreur fermeture connexion:', closeErr);
        }
      }
    }
  },

  async getAllGroups(req, res) {
    try {
      const result = await execute(
        `SELECT g.id, g.nom, g.description, g.createur_id, 
                u.nom as createur_nom, 
                (SELECT COUNT(*) FROM UTILISATEURS_GROUPES ug WHERE ug.groupe_id = g.id) as nb_membres
         FROM groupes g
         JOIN utilisateurs u ON g.createur_id = u.id
         ORDER BY g.date_creation DESC`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const groupes = result.rows?.map(row => ({
        id: row.ID,
        nom: row.NOM,
        description: row.DESCRIPTION,
        createur_id: row.CREATEUR_ID,
        createur_nom: row.CREATEUR_NOM,
        nb_membres: row.NB_MEMBRES
      })) || [];

      res.json({ success: true, data: groupes });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur chargement groupes' });
    }
  },

  async getGroupDetails(req, res) {
    try {
      const groupeId = req.params.id;

      const groupResult = await execute(
        `SELECT g.id, g.nom, g.description, g.createur_id, u.nom as createur_nom
         FROM groupes g
         JOIN utilisateurs u ON g.createur_id = u.id
         WHERE g.id = :groupeId`,
        { groupeId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (!groupResult.rows?.length) {
        return res.status(404).json({ success: false, error: 'Groupe non trouvé' });
      }

      const membersResult = await execute(
        `SELECT u.id, u.nom, u.email
         FROM UTILISATEURS_GROUPES ug
         JOIN utilisateurs u ON ug.utilisateur_id = u.id
         WHERE ug.groupe_id = :groupeId
         ORDER BY u.nom ASC`,
        { groupeId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const result = {
        id: groupResult.rows[0].ID,
        nom: groupResult.rows[0].NOM,
        description: groupResult.rows[0].DESCRIPTION,
        createur_id: groupResult.rows[0].CREATEUR_ID,
        createur_nom: groupResult.rows[0].CREATEUR_NOM,
        membres: membersResult.rows?.map(row => ({
          id: row.ID,
          nom: row.NOM,
          email: row.EMAIL
        })) || []
      };

      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erreur récupération détails' });
    }
  },

  async update(req, res) {
    let connection;
    try {
      connection = await oracledb.getConnection();
      const groupeId = req.params.id;
      const { nom, description, membres = [] } = req.body;

      if (!nom || nom.length < 3) {
        return res.status(400).json({ success: false, error: 'Nom invalide' });
      }

      const groupeExists = await execute(
        `SELECT 1 FROM groupes WHERE id = :groupeId`, 
        { groupeId }, 
        { connection }
      );
      if (!groupeExists.rows.length) {
        return res.status(404).json({ success: false, error: 'Groupe non trouvé' });
      }

      await execute(
        `UPDATE groupes SET nom = :nom, description = :description WHERE id = :groupeId`,
        { nom, description: description || null, groupeId },
        { connection }
      );

      // Supprimer tous les membres sauf le créateur
      await execute(
        `DELETE FROM UTILISATEURS_GROUPES 
         WHERE groupe_id = :groupeId 
         AND utilisateur_id != (SELECT createur_id FROM groupes WHERE id = :groupeId)`,
        { groupeId },
        { connection }
      );

      // Ajouter les nouveaux membres
      const validMembres = membres.map(id => parseInt(id)).filter(id => !isNaN(id));
      for (const membreId of validMembres) {
        await execute(
          `INSERT INTO UTILISATEURS_GROUPES (groupe_id, utilisateur_id, date_ajout)
           VALUES (:groupeId, :utilisateurId, SYSTIMESTAMP)`,
          { groupeId, utilisateurId: membreId },
          { connection }
        );
      }

      await connection.commit();
      res.json({ success: true, message: 'Groupe modifié avec succès' });

    } catch (err) {
      if (connection) await connection.rollback();
      res.status(500).json({ success: false, error: 'Erreur modification groupe' });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeErr) {
          console.error('Erreur fermeture connexion:', closeErr);
        }
      }
    }
  },

  async delete(req, res) {
    let connection;
    try {
      connection = await oracledb.getConnection();
      const groupeId = req.params.id;

      const groupeExists = await execute(
        `SELECT 1 FROM groupes WHERE id = :groupeId`, 
        { groupeId }, 
        { connection }
      );
      if (!groupeExists.rows.length) {
        return res.status(404).json({ success: false, error: 'Groupe non trouvé' });
      }

      await execute(
        `DELETE FROM UTILISATEURS_GROUPES WHERE groupe_id = :groupeId`,
        { groupeId },
        { connection }
      );

      await execute(
        `DELETE FROM groupes WHERE id = :groupeId`,
        { groupeId },
        { connection }
      );

      await connection.commit();
      res.json({ success: true, message: 'Groupe supprimé avec succès' });

    } catch (err) {
      if (connection) await connection.rollback();
      res.status(500).json({ success: false, error: 'Erreur suppression groupe' });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeErr) {
          console.error('Erreur fermeture connexion:', closeErr);
        }
      }
    }
  },
  // Ajoutez ces fonctions à votre groupController.js avant le }; final

async addMember(req, res) {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const groupeId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'ID utilisateur requis' });
    }

    // Vérifier si le groupe existe
    const groupeExists = await execute(
      `SELECT 1 FROM groupes WHERE id = :groupeId`, 
      { groupeId }, 
      { connection }
    );
    if (!groupeExists.rows.length) {
      return res.status(404).json({ success: false, error: 'Groupe non trouvé' });
    }

    // Vérifier si l'utilisateur existe
    const userExists = await execute(
      `SELECT 1 FROM utilisateurs WHERE id = :userId`, 
      { userId }, 
      { connection }
    );
    if (!userExists.rows.length) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur n'est pas déjà membre
    const memberExists = await execute(
      `SELECT 1 FROM UTILISATEURS_GROUPES WHERE groupe_id = :groupeId AND utilisateur_id = :userId`, 
      { groupeId, userId }, 
      { connection }
    );
    if (memberExists.rows.length) {
      return res.status(400).json({ success: false, error: 'Utilisateur déjà membre du groupe' });
    }

    // Ajouter le membre
    await execute(
      `INSERT INTO UTILISATEURS_GROUPES (groupe_id, utilisateur_id, date_ajout)
       VALUES (:groupeId, :userId, SYSTIMESTAMP)`,
      { groupeId, userId },
      { connection }
    );

    await connection.commit();
    res.json({ success: true, message: 'Membre ajouté avec succès' });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Erreur addMember:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'ajout du membre' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Erreur fermeture connexion:', closeErr);
      }
    }
  }
},

async removeMember(req, res) {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const groupeId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'ID utilisateur requis' });
    }

    // Vérifier si le groupe existe
    const groupeExists = await execute(
      `SELECT createur_id FROM groupes WHERE id = :groupeId`, 
      { groupeId }, 
      { connection, outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!groupeExists.rows.length) {
      return res.status(404).json({ success: false, error: 'Groupe non trouvé' });
    }

    // Empêcher la suppression du créateur
    const createurId = groupeExists.rows[0].CREATEUR_ID;
    if (parseInt(userId) === createurId) {
      return res.status(400).json({ success: false, error: 'Impossible de supprimer le créateur du groupe' });
    }

    // Supprimer le membre
    const result = await execute(
      `DELETE FROM UTILISATEURS_GROUPES 
       WHERE groupe_id = :groupeId AND utilisateur_id = :userId`,
      { groupeId, userId },
      { connection }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: 'Membre non trouvé dans ce groupe' });
    }

    await connection.commit();
    res.json({ success: true, message: 'Membre supprimé avec succès' });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Erreur removeMember:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression du membre' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Erreur fermeture connexion:', closeErr);
      }
    }
  }
},

async getUserGroups(req, res) {
  try {
    const userId = req.user.id;
    
    const result = await execute(
      `SELECT g.id, g.nom, g.description, g.createur_id,
              u.nom as createur_nom,
              (SELECT COUNT(*) FROM UTILISATEURS_GROUPES ug WHERE ug.groupe_id = g.id) as nb_membres
       FROM groupes g
       JOIN utilisateurs u ON g.createur_id = u.id
       JOIN UTILISATEURS_GROUPES ug ON g.id = ug.groupe_id
       WHERE ug.utilisateur_id = :userId
       ORDER BY g.date_creation DESC`,
      { userId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const groupes = result.rows?.map(row => ({
      id: row.ID,
      nom: row.NOM,
      description: row.DESCRIPTION,
      createur_id: row.CREATEUR_ID,
      createur_nom: row.CREATEUR_NOM,
      nb_membres: row.NB_MEMBRES,
      est_createur: row.CREATEUR_ID === userId
    })) || [];

    res.json({ success: true, data: groupes });
  } catch (err) {
    console.error('Erreur getUserGroups:', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des groupes' });
  }
}
};