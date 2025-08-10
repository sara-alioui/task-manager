// backend/test-connection.js
const oracledb = require('oracledb');
require('dotenv').config();

async function testConnection() {
  console.log('🔎 Début du test de connexion Oracle...');

  // 1. Configuration du client
  try {
    console.log('\n1. Configuration du client Oracle...');
    await oracledb.initOracleClient({ 
      libDir: process.env.ORACLE_HOME + '\\bin' 
    });
    console.log('✓ Mode Thick activé');
  } catch (err) {
    console.log('✓ Mode Thin activé (fallback)');
    oracledb.initOracleClient({ driverType: 'thin' });
  }

  // 2. Test de connexion
  let connection;
  try {
    console.log('\n2. Tentative de connexion...');
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECTION_STRING
    });
    console.log('✓ Connexion établie !');

    // 3. Test de requête
    console.log('\n3. Exécution d\'une requête test...');
    const result = await connection.execute(
      `SELECT 
         instance_name, 
         version,
         status 
       FROM v$instance`
    );
    console.log('✓ Résultat de la requête :', result.rows[0]);

  } catch (err) {
    console.error('\n❌ ERREUR:', {
      Message: err.message,
      Code: err.errorNum || 'N/A',
      Conseils: err.errorNum === 12541 
        ? 'Vérifiez que le listener Oracle est démarré (Get-Service -Name Oracle*)' 
        : 'Vérifiez les identifiants dans .env'
    });
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

testConnection();