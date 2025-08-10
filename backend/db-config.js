module.exports = {
  client: {
    libDir: process.env.ORACLE_HOME + '\\bin',
    configDir: process.env.ORACLE_HOME + '\\network\\admin',
    driverType: 'thick'
  },
  pool: {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
    poolTimeout: 60,
    queueTimeout: 30000,
    stmtCacheSize: 30
  }
};