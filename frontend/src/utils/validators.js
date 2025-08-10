/**
 * Validation d'email avec regex
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validation des mots de passe (exigences minimales)
 * @param {string} password
 * @returns {object} { isValid: boolean, message: string }
 */
export const validatePassword = (password) => {
  if (password.length < 8) {
    return { isValid: false, message: '8 caractères minimum' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: '1 majuscule minimum' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: '1 chiffre minimum' };
  }
  return { isValid: true, message: '' };
};

/**
 * Vérifie si une valeur est vide (null, undefined, string vide)
 * @param {*} value
 * @returns {boolean}
 */
export const isEmpty = (value) => {
  return value === null || value === undefined || value.trim() === '';
};