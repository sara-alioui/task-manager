const { body, param, query, validationResult } = require('express-validator');
const db = require('../db');
const { isAfter, parseISO } = require('date-fns');

module.exports = {
  validateLogin: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email requis')
      .isEmail().withMessage('Format email invalide')
      .normalizeEmail()
      .custom(async (email) => {
        const result = await db.execute(
          'SELECT 1 FROM utilisateurs WHERE email = :email',
          { email },
          { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );
        if (!result.rows?.length) {
          throw new Error('Aucun compte associé à cet email');
        }
      }),
    
    body('password')
      .trim()
      .notEmpty().withMessage('Mot de passe requis')
      .isLength({ min: 8 }).withMessage('8 caractères minimum')
      .matches(/[A-Z]/).withMessage('Doit contenir au moins une majuscule')
      .matches(/[0-9]/).withMessage('Doit contenir au moins un chiffre')
  ],

  validateRegister: [
    body('nom')
      .trim()
      .notEmpty().withMessage('Nom requis')
      .isLength({ max: 50 }).withMessage('50 caractères maximum'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email requis')
      .isEmail().withMessage('Format email invalide')
      .normalizeEmail()
      .custom(async (email) => {
        const result = await db.execute(
          'SELECT 1 FROM utilisateurs WHERE email = :email',
          { email },
          { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );
        if (result.rows?.length) {
          throw new Error('Email déjà utilisé');
        }
      }),
    
    body('password')
      .trim()
      .notEmpty().withMessage('Mot de passe requis')
      .isLength({ min: 8 }).withMessage('8 caractères minimum')
      .matches(/[A-Z]/).withMessage('Doit contenir au moins une majuscule')
      .matches(/[0-9]/).withMessage('Doit contenir au moins un chiffre'),
    
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Les mots de passe ne correspondent pas');
        }
        return true;
      })
  ],

  validateUserUpdate: [
    body('nom')
      .optional()
      .trim()
      .notEmpty().withMessage('Le nom ne peut pas être vide')
      .isLength({ max: 50 }).withMessage('50 caractères maximum'),
    
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Format email invalide')
      .normalizeEmail()
      .custom(async (email, { req }) => {
        if (email) {
          const result = await db.execute(
            'SELECT id FROM utilisateurs WHERE email = :email AND id != :currentId',
            { email, currentId: req.params.id },
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
          );
          if (result.rows?.length) {
            throw new Error('Email déjà utilisé par un autre utilisateur');
          }
        }
      }),
    
    body('role')
      .optional()
      .isIn(['admin', 'user']).withMessage('Rôle invalide (admin ou user)'),
    
    body('actif')
      .optional()
      .isBoolean().withMessage('Le statut actif doit être un booléen')
  ],

  validateTask: [
    body('titre')
      .trim()
      .notEmpty().withMessage('Le titre est requis')
      .isLength({ max: 100 }).withMessage('100 caractères maximum'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('500 caractères maximum'),
    
    body('date_echeance')
      .optional()
      .isISO8601().withMessage('Format date invalide (YYYY-MM-DD)')
      .custom((date) => {
        if (isAfter(parseISO(date), new Date())) {
          throw new Error('La date doit être dans le futur');
        }
        return true;
      }),
    
    body('priorite')
      .optional()
      .isIn(['faible', 'moyenne', 'haute']).withMessage('Priorité invalide')
  ],

  validateGroup: [
    body('nom')
      .trim()
      .notEmpty().withMessage('Nom du groupe requis')
      .isLength({ max: 50 }).withMessage('50 caractères maximum'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 300 }).withMessage('300 caractères maximum')
  ],

  validateIdParam: [
    param('id')
      .notEmpty().withMessage('ID requis')
      .isInt({ min: 1 }).withMessage('ID doit être un nombre positif')
      .toInt()
  ],

  validateTaskFilters: [
    query('statut')
      .optional()
      .isIn(['a_faire', 'en_cours', 'termine']).withMessage('Statut invalide'),
    
    query('priorite')
      .optional()
      .isIn(['faible', 'moyenne', 'haute']).withMessage('Priorité invalide'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100')
      .toInt(),
    
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page doit être un nombre positif')
      .toInt()
  ],

  checkValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          type: err.type
        }))
      });
    }
    next();
  }
};