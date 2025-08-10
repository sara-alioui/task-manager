// Initialisation globale avant les tests
const oracledb = require('oracledb');

beforeAll(async () => {
  // Config commune pour tous les tests
  oracledb.initOracleClient({ 
    libDir: process.env.ORACLE_LIB_DIR 
  });
});

afterAll(() => {
  // Nettoyage global
});