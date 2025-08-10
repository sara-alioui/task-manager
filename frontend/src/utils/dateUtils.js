/**
 * Formatage des dates Oracle (TIMESTAMP → Date lisible avec heure)
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
  } catch {
    return 'Date invalide';
  }
};

/**
 * Formatage simple (date seule, sans l'heure)
 * @param {string} dateStr - Une chaîne de date (type Date ou ISO)
 * @returns {string} Format lisible JJ mois AAAA
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';

  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Date invalide';
  }
};
