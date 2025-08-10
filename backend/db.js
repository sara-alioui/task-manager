require('dotenv').config();
const oracledb = require('oracledb');

const config = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING,
  poolMin: 1,
  poolMax: 5,
  poolIncrement: 1
};

let pool;

(async () => {
  try {
    pool = await oracledb.createPool(config);
    console.log('✅ Pool Oracle créé avec succès');
  } catch (err) {
    console.error('🔴 ERREUR Oracle:', err.message);
    process.exit(1);
  }
})();

module.exports = {
  oracledb,
  execute: async (sql, binds = {}, options = {}) => {
    let conn;
    try {
      conn = await pool.getConnection();
      return await conn.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: options.autoCommit ?? true
      });
    } finally {
      if (conn) await conn.close();
    }
  }
};
