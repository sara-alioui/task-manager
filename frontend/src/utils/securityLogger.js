module.exports = {
  logSecurityEvent: (eventType, details) => {
    console.log(`[SECURITY] ${eventType}`, details);
    // Ici vous pourriez ajouter un enregistrement en base
  }
};