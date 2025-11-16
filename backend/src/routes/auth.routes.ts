import { Router } from 'express';
import { Schema } from 'express-validator';

import { login, logout, refresh, register } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';

const loginValidation: Schema = {
  identifier: {
    in: ['body'],
    isString: { errorMessage: 'Identifier is required' },
    trim: true,
    isLength: {
      options: { min: 3 },
      errorMessage: 'Identifier must be at least 3 characters long',
    },
  },
  password: {
    in: ['body'],
    isString: { errorMessage: 'Password is required' },
    isLength: {
      options: { min: 8 },
      errorMessage: 'Password must be at least 8 characters long',
    },
  },
};

const registerValidation: Schema = {
  username: {
    in: ['body'],
    isString: { errorMessage: 'Username is required' },
    trim: true,
    isLength: {
      options: { min: 3 },
      errorMessage: 'Username must be at least 3 characters long',
    },
  },
  email: {
    in: ['body'],
    isEmail: { errorMessage: 'A valid email is required' },
    normalizeEmail: true,
  },
  password: {
    in: ['body'],
    isString: { errorMessage: 'Password is required' },
    isLength: {
      options: { min: 8 },
      errorMessage: 'Password must be at least 8 characters long',
    },
  },
  fullName: {
    in: ['body'],
    isString: { errorMessage: 'Full name is required' },
    notEmpty: { errorMessage: 'Full name is required' },
  },
  roles: {
    in: ['body'],
    isArray: {
      options: { min: 1 },
      errorMessage: 'At least one role must be provided',
    },
  },
  'roles.*': {
    in: ['body'],
    isString: { errorMessage: 'Roles must be strings' },
    notEmpty: { errorMessage: 'Roles cannot be empty' },
  },
};

const refreshValidation: Schema = {
  refreshToken: {
    in: ['body'],
    isString: { errorMessage: 'Refresh token is required' },
    isLength: {
      options: { min: 20 },
      errorMessage: 'Refresh token must be at least 20 characters long',
    },
  },
};

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and get tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validate(loginValidation), login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New access token
 *                 refreshToken:
 *                   type: string
 *                   description: New refresh token
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', validate(refreshValidation), refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user and invalidate session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out
 *       401:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', validate(refreshValidation), logout);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validate(registerValidation), register);

export default router;
