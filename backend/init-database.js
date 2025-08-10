const oracledb = require('oracledb');
const dbConfig = {
  user: "system",
  password: "Kfhx8261",
  connectString: "localhost:1521/FREEPDB1"
};

async function execute(sql, binds = []) {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    return await connection.execute(sql, binds, { autoCommit: true });
  } finally {
    if (connection) await connection.close();
  }
}

async function initDatabase() {
  try {
    console.log('🚀 Initialisation de la base de données...');

    // Suppression des tables existantes
    try {
      await execute('DROP TABLE taches');
      console.log('✓ Table taches supprimée');
    } catch (err) { console.log('ℹ Table taches inexistante'); }

    try {
      await execute('DROP TABLE utilisateurs_groupes');
      console.log('✓ Table utilisateurs_groupes supprimée');
    } catch (err) { console.log('ℹ Table utilisateurs_groupes inexistante'); }

    try {
      await execute('DROP TABLE groupes');
      console.log('✓ Table groupes supprimée');
    } catch (err) { console.log('ℹ Table groupes inexistante'); }

    try {
      await execute('DROP TABLE utilisateurs');
      console.log('✓ Table utilisateurs supprimée');
    } catch (err) { console.log('ℹ Table utilisateurs inexistante'); }

    // Création des tables
    await execute(`CREATE TABLE utilisateurs (
      id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      nom VARCHAR2(100) NOT NULL,
      email VARCHAR2(100) UNIQUE NOT NULL,
      motdepasse VARCHAR2(200) NOT NULL,
      role VARCHAR2(20) DEFAULT 'utilisateur',
      date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('✓ Table utilisateurs créée');

    await execute(`CREATE TABLE groupes (
      id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      nom VARCHAR2(100) NOT NULL,
      description VARCHAR2(500),
      createur_id NUMBER,
      date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('✓ Table groupes créée');

    await execute(`CREATE TABLE utilisateurs_groupes (
      utilisateur_id NUMBER NOT NULL,
      groupe_id NUMBER NOT NULL,
      date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (utilisateur_id, groupe_id),
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
      FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE
    )`);
    console.log('✓ Table utilisateurs_groupes créée');

    await execute(`CREATE TABLE taches (
      id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      titre VARCHAR2(200) NOT NULL,
      description VARCHAR2(1000),
      statut VARCHAR2(20) DEFAULT 'à faire',
      utilisateur_id NUMBER NOT NULL,
      groupe_id NUMBER,
      date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      date_echeance TIMESTAMP,
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
      FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE SET NULL
    )`);
    console.log('✓ Table taches créée');

    console.log('✅ Base de données initialisée avec succès!');
  } catch (err) {
    console.error('❌ ERREUR:', err.message);
    process.exit(1);
  }
}

// Exécution
initDatabase();