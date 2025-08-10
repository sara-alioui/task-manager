require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const oracledb = require('oracledb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 Solution définitive pour le PATH Oracle
if (process.platform === 'win32') {
  process.env.PATH = `${process.env.PATH};${process.env.ORACLE_HOME}`;
}

// 🔌 Config Oracle
const ORACLE_CONFIG = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING.replace('//', '')
};

let oracleReady = false;

// 🔌 Initialisation Oracle
(async () => {
  try {
    oracledb.initOracleClient({
      libDir: process.env.ORACLE_HOME,
      configDir: process.env.ORACLE_HOME
    });
    console.log('🟢 Oracle Client initialisé');

    let retry = 0;
    while (retry < 3) {
      try {
        const conn = await oracledb.getConnection(ORACLE_CONFIG);
        await conn.close();
        oracleReady = true;
        console.log('✅ Connexion Oracle validée');
        break;
      } catch (err) {
        retry++;
        if (retry === 3) throw err;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (err) {
    console.error('🔴 ERREUR Oracle:', err.message);
    console.error('⚠️ Vérifiez que:');
    console.error('- Instant Client est dans C:\\oracle\\instantclient_21_9');
    console.error('- Les DLL sont présentes (oci.dll, oraons.dll)');
    console.error('- Le service Oracle est démarré (services.msc)');
  }
})();

// 🌐 Configuration CORS Renforcée
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pré-requêtes OPTIONS

// Autres middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 🛡️ Middleware de vérification Oracle
app.use((req, res, next) => {
  if (!oracleReady && !req.path.startsWith('/api/health')) {
    return res.status(503).json({ 
      error: 'Oracle non connecté',
      solution: 'Vérifiez les logs du serveur'
    });
  }
  next();
});

// 🧪 Health Check
app.get('/api/health', async (req, res) => {
  try {
    const conn = await oracledb.getConnection(ORACLE_CONFIG);
    const result = await conn.execute(`SELECT 1 FROM DUAL`);
    await conn.close();
    
    res.json({
      status: 'healthy',
      oracle: {
        connected: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      oracle: {
        connected: false,
        error: err.message
      }
    });
  }
});

// ✅ ROUTES
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const groupesRoutes = require('./routes/groups');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/groups', groupesRoutes);

// 📦 Serveur React (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// 🚀 Lancement du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`🌐 CORS autorisé pour : ${corsOptions.origin}`);
  console.log(`🔌 Tentative de connexion Oracle en cours...`);
});

module.exports = app;