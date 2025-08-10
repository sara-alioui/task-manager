module.exports = {
  testEnvironment: 'node',          // Pour backend Node.js
  testTimeout: 10000,              // Spécifique aux tests Oracle
  collectCoverage: true,           // Active les rapports
  coveragePathIgnorePatterns: [    // Exclut ces dossiers
    '/node_modules/',
    '/__tests__/'
  ]
};