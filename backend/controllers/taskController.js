const db = require('../db');

module.exports = {
  async getAll(req, res) {
    try {
      const { id: userId, role } = req.user;
      let query, params;

      if (role === 'admin') {
        // ✅ Ajout de DATE_ECHEANCE dans la sélection
        query = `SELECT 
                   ID,
                   TITRE,
                   DESCRIPTION,
                   STATUT,
                   UTILISATEUR_ID,
                   GROUPE_ID,
                   DATE_CREATION,
                   DATE_ECHEANCE
                 FROM TACHES 
                 ORDER BY DATE_CREATION DESC`;
        params = [];
      } else {
        query = `SELECT 
                   t.ID,
                   t.TITRE,
                   t.DESCRIPTION,
                   t.STATUT,
                   t.UTILISATEUR_ID,
                   t.GROUPE_ID,
                   t.DATE_CREATION,
                   t.DATE_ECHEANCE
                 FROM TACHES t
                 LEFT JOIN UTILISATEURS_GROUPES ug ON t.GROUPE_ID = ug.GROUPE_ID
                 WHERE t.UTILISATEUR_ID = :userId 
                 OR ug.UTILISATEUR_ID = :userId
                 OR t.GROUPE_ID IN (
                   SELECT GROUPE_ID FROM UTILISATEURS_GROUPES 
                   WHERE UTILISATEUR_ID = :userId
                 )
                 ORDER BY t.DATE_CREATION DESC`;
        params = { userId };
      }

      const result = await db.execute(query, params);

      // ✅ Mapping correct des colonnes Oracle vers le frontend
      const formattedTasks = result.rows.map(row => ({
        id: row.ID,
        titre: row.TITRE,
        description: row.DESCRIPTION,
        statut: row.STATUT,
        utilisateurId: row.UTILISATEUR_ID,
        groupId: row.GROUPE_ID,
        dateCreation: row.DATE_CREATION,
        dateLimite: row.DATE_ECHEANCE, // ✅ Mapping correct
        date_limite: row.DATE_ECHEANCE, // Alternative pour compatibilité
        DATE_LIMITE: row.DATE_ECHEANCE  // Alternative pour compatibilité
      }));

      res.json({
        success: true,
        count: formattedTasks.length,
        data: formattedTasks,
        tasks: formattedTasks
      });

    } catch (err) {
      console.error('Get Tasks Error:', err);
      res.status(500).json({
        success: false,
        error: 'Erreur récupération tâches'
      });
    }
  },

  async getMesTaches(req, res) {
    try {
      const { id: userId } = req.user;
      
      const query = `SELECT 
                       t.ID,
                       t.TITRE,
                       t.DESCRIPTION,
                       t.STATUT,
                       t.UTILISATEUR_ID,
                       t.GROUPE_ID,
                       t.DATE_CREATION,
                       t.DATE_ECHEANCE
                     FROM TACHES t
                     LEFT JOIN UTILISATEURS_GROUPES ug ON t.GROUPE_ID = ug.GROUPE_ID
                     WHERE t.UTILISATEUR_ID = :userId 
                     OR ug.UTILISATEUR_ID = :userId
                     ORDER BY t.DATE_CREATION DESC`;
      
      const result = await db.execute(query, { userId });

      // ✅ Mapping correct des colonnes
      const formattedTasks = result.rows.map(row => ({
        id: row.ID,
        titre: row.TITRE,
        description: row.DESCRIPTION,
        statut: row.STATUT,
        utilisateurId: row.UTILISATEUR_ID,
        groupId: row.GROUPE_ID,
        dateCreation: row.DATE_CREATION,
        dateLimite: row.DATE_ECHEANCE
      }));

      res.json({
        success: true,
        count: formattedTasks.length,
        data: formattedTasks,
        tasks: formattedTasks
      });

    } catch (err) {
      console.error('Get My Tasks Error:', err);
      res.status(500).json({
        success: false,
        error: 'Erreur récupération de vos tâches'
      });
    }
  },

  async create(req, res) {
    try {
      // ✅ Correction : récupérer dateLimite depuis le frontend
      const { title, titre, description, dateLimite, dueDate, utilisateurId, assigneA, groupeId } = req.body;
      const { id: createdBy, role } = req.user;

      console.log('🟡 Données reçues:', req.body);

      const taskTitle = titre || title;
      let assignedUserId = utilisateurId || assigneA;
      
      // ✅ Utiliser dateLimite du frontend ou dueDate comme fallback
      const dateEcheance = dateLimite || dueDate;
      
      console.log('📅 Date limite détectée:', {
        dateLimite,
        dueDate,
        dateEcheance,
        type: typeof dateEcheance
      });
      
      // Validation du titre
      if (!taskTitle || taskTitle.trim().length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Titre invalide (min 3 caractères)'
        });
      }

      // Logique flexible : Permettre utilisateur, groupe ou les deux
      if (!groupeId && !assignedUserId) {
        assignedUserId = createdBy;
        console.log('📝 Aucun assigné spécifié, assignation à l\'utilisateur courant:', createdBy);
      }

      // Vérification si l'utilisateur existe
      if (assignedUserId) {
        const userCheck = await db.execute(
          `SELECT ID FROM UTILISATEURS WHERE ID = :userId`,
          { userId: assignedUserId }
        );
        
        if (!userCheck.rows.length) {
          return res.status(404).json({
            success: false,
            error: `Utilisateur avec l'ID ${assignedUserId} non trouvé`
          });
        }
        console.log('✅ Utilisateur trouvé:', assignedUserId);
      }

      // Vérification si le groupe existe
      if (groupeId) {
        const groupeCheck = await db.execute(
          `SELECT ID FROM GROUPES WHERE ID = :groupeId`,
          { groupeId }
        );
        
        if (!groupeCheck.rows.length) {
          return res.status(404).json({
            success: false,
            error: `Groupe avec l'ID ${groupeId} non trouvé`
          });
        }
        console.log('✅ Groupe trouvé:', groupeId);
      }

      console.log('📋 Assignation finale:', {
        utilisateur: assignedUserId,
        groupe: groupeId,
        dateEcheance
      });

      // ✅ Requête corrigée avec les bons noms de colonnes Oracle
      const result = await db.execute(
        `INSERT INTO TACHES (
          TITRE, 
          DESCRIPTION, 
          STATUT,
          DATE_ECHEANCE, 
          UTILISATEUR_ID, 
          GROUPE_ID,
          DATE_CREATION
         ) VALUES (
          :title, 
          :description, 
          'en attente',
          :dateEcheance, 
          :utilisateur_id, 
          :groupe_id,
          SYSTIMESTAMP
         ) RETURNING ID INTO :id`,
        {
          title: taskTitle.trim(),
          description: description ? description.trim() : null,
          dateEcheance: dateEcheance ? new Date(dateEcheance) : null, // ✅ Utilisation correcte
          utilisateur_id: assignedUserId || null,
          groupe_id: groupeId || null,
          id: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT }
        }
      );

      const taskId = result.outBinds.id[0];

      console.log("✅ Tâche créée avec succès:", {
        id: taskId,
        titre: taskTitle,
        assignedUserId,
        groupeId,
        dateEcheance,
        createdBy
      });

      res.status(201).json({
        success: true,
        message: 'Tâche créée avec succès',
        data: {
          id: taskId,
          titre: taskTitle.trim(),
          description: description ? description.trim() : null,
          statut: 'en attente',
          utilisateur_id: assignedUserId,
          groupe_id: groupeId || null,
          date_echeance: dateEcheance || null,
          dateLimite: dateEcheance || null // ✅ Pour le frontend
        }
      });

    } catch (err) {
      console.error('❌ Create Task Error:', err);
      res.status(500).json({
        success: false,
        error: 'Erreur création tâche: ' + (err.message || 'Erreur inconnue')
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, titre, description, completed, statut, utilisateurId, groupeId, dateLimite } = req.body;
      const { id: userId, role } = req.user;

      console.log('🔄 Mise à jour tâche:', { id, body: req.body, user: { userId, role } });

      // Vérification des permissions (code existant...)
      if (role !== 'admin') {
        const checkResult = await db.execute(
          `SELECT UTILISATEUR_ID, GROUPE_ID FROM TACHES WHERE ID = :id`,
          { id }
        );
        
        if (!checkResult.rows.length) {
          return res.status(404).json({
            success: false,
            error: 'Tâche non trouvée'
          });
        }

        const task = checkResult.rows[0];
        const isUserTask = task.UTILISATEUR_ID === userId;
        const isGroupTask = task.GROUPE_ID !== null;

        let isInGroup = false;
        if (isGroupTask) {
          const groupCheck = await db.execute(
            `SELECT 1 FROM UTILISATEURS_GROUPES 
             WHERE GROUPE_ID = :groupeId AND UTILISATEUR_ID = :userId`,
            { groupeId: task.GROUPE_ID, userId }
          );
          isInGroup = groupCheck.rows.length > 0;
        }

        if (!isUserTask && !isInGroup) {
          return res.status(403).json({
            success: false,
            error: 'Non autorisé à modifier cette tâche'
          });
        }
      }

      const taskTitle = titre || title;
      const taskStatus = statut || (completed ? 'terminé' : 'en attente');

      // ✅ Construction de la requête avec DATE_ECHEANCE
      let updateQuery = `UPDATE TACHES SET 
        TITRE = :title,
        DESCRIPTION = :description,
        STATUT = :statut`;

      const params = {
        title: taskTitle,
        description: description || null,
        statut: taskStatus,
        id
      };

      // ✅ Ajout de la date limite si fournie
      if (dateLimite !== undefined) {
        updateQuery += ', DATE_ECHEANCE = :dateLimite';
        params.dateLimite = dateLimite ? new Date(dateLimite) : null;
      }

      // Gestion des changements d'assignation (seulement pour les admins)
      if (role === 'admin') {
        if (utilisateurId !== undefined) {
          updateQuery += ', UTILISATEUR_ID = :utilisateur_id';
          params.utilisateur_id = utilisateurId || null;
        }

        if (groupeId !== undefined) {
          updateQuery += ', GROUPE_ID = :groupe_id';
          params.groupe_id = groupeId || null;
        }
      }

      updateQuery += ' WHERE ID = :id';

      const result = await db.execute(updateQuery, params);

      if (result.rowsAffected === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tâche non trouvée'
        });
      }

      console.log('✅ Tâche mise à jour avec succès:', id);

      res.json({
        success: true,
        message: 'Tâche mise à jour avec succès'
      });

    } catch (err) {
      console.error('❌ Update Task Error:', err);
      res.status(500).json({
        success: false,
        error: 'Erreur mise à jour tâche: ' + (err.message || 'Erreur inconnue')
      });
    }
  },

  async deleteTask(req, res) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;

      console.log('🗑️ Suppression tâche:', { id, user: { userId, role } });

      // Vérification des permissions
      if (role !== 'admin') {
        const checkResult = await db.execute(
          `SELECT UTILISATEUR_ID, GROUPE_ID FROM TACHES WHERE ID = :id`,
          { id }
        );
        
        if (!checkResult.rows.length) {
          return res.status(404).json({
            success: false,
            error: 'Tâche non trouvée'
          });
        }

        const task = checkResult.rows[0];
        const isUserTask = task.UTILISATEUR_ID === userId;
        const isGroupTask = task.GROUPE_ID !== null;

        let isInGroup = false;
        if (isGroupTask) {
          const groupCheck = await db.execute(
            `SELECT 1 FROM UTILISATEURS_GROUPES 
             WHERE GROUPE_ID = :groupeId AND UTILISATEUR_ID = :userId`,
            { groupeId: task.GROUPE_ID, userId }
          );
          isInGroup = groupCheck.rows.length > 0;
        }

        if (!isUserTask && !isInGroup) {
          return res.status(403).json({
            success: false,
            error: 'Non autorisé à supprimer cette tâche'
          });
        }
      }

      const result = await db.execute(
        `DELETE FROM TACHES WHERE ID = :id`,
        { id }
      );

      if (result.rowsAffected === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tâche non trouvée'
        });
      }

      console.log('✅ Tâche supprimée avec succès:', id);

      res.json({
        success: true,
        message: 'Tâche supprimée avec succès'
      });

    } catch (err) {
      console.error('❌ Delete Task Error:', err);
      res.status(500).json({
        success: false,
        error: 'Erreur suppression tâche: ' + (err.message || 'Erreur inconnue')
      });
    }
  },

  async getStats(req, res) {
    try {
      const { id: userId, role } = req.user;
      
      let whereClause = '';
      let params = {};
      
      if (role !== 'admin') {
        whereClause = `WHERE t.UTILISATEUR_ID = :userId 
                      OR t.GROUPE_ID IN (
                        SELECT GROUPE_ID FROM UTILISATEURS_GROUPES 
                        WHERE UTILISATEUR_ID = :userId
                      )`;
        params = { userId };
      }

      const query = `
        SELECT 
          COUNT(*) as TOTAL,
          SUM(CASE WHEN STATUT = 'en attente' THEN 1 ELSE 0 END) as EN_ATTENTE,
          SUM(CASE WHEN STATUT = 'en cours' THEN 1 ELSE 0 END) as EN_COURS,
          SUM(CASE WHEN STATUT = 'terminé' THEN 1 ELSE 0 END) as TERMINE,
          SUM(CASE WHEN UTILISATEUR_ID IS NOT NULL THEN 1 ELSE 0 END) as ASSIGNEES_USER,
          SUM(CASE WHEN GROUPE_ID IS NOT NULL THEN 1 ELSE 0 END) as ASSIGNEES_GROUP
        FROM TACHES t
        ${whereClause}
      `;

      const result = await db.execute(query, params);
      
      const stats = result.rows[0];

      res.json({
        success: true,
        data: {
          total: stats.TOTAL,
          en_attente: stats.EN_ATTENTE,
          en_cours: stats.EN_COURS,
          termine: stats.TERMINE,
          assignees_user: stats.ASSIGNEES_USER,
          assignees_group: stats.ASSIGNEES_GROUP
        }
      });

    } catch (err) {
      console.error('❌ Get Stats Error:', err);
      res.status(500).json({
        success: false,
        error: 'Erreur récupération statistiques'
      });
    }
  }
};