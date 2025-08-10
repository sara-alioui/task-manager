/**
 * Formatage des dates Oracle (TIMESTAMP → Date lisible)
 * @param {string} oracleTimestamp - Date au format Oracle TIMESTAMP
 * @returns {string} Date formatée (JJ/MM/AAAA HH:MM)
 */
export const formatOracleDate = (oracleTimestamp) => {
  if (!oracleTimestamp) return 'N/A';
  
  try {
    const date = new Date(oracleTimestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return oracleTimestamp; // Retourne la valeur originale si échec
  }
};

/**
 * Convertit une date JS en format Oracle DATE
 * @param {Date} date - Objet Date JavaScript
 * @returns {string} Format compatible Oracle (YYYY-MM-DD)
 */
export const toOracleDate = (date) => {
  return date.toISOString().split('T')[0];
};