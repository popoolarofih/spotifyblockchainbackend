const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

/**
 * @swagger
 * /auth/login:
 *   get:
 *     summary: Login with Spotify
 *     tags: [Authentication]
 *     description: Redirects the user to the Spotify authentication page to grant permission.
 *     responses:
 *       302:
 *         description: A successful redirect to Spotify's login page.
 */
router.get('/login', authController.login);

/**
 * @swagger
 * /auth/callback:
 *   get:
 *     summary: Spotify authentication callback
 *     tags: [Authentication]
 *     description: This is the callback URL that Spotify redirects to after user authentication. It handles the code exchange and user creation/login. The user is then redirected to the frontend with a JWT.
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: The authorization code returned from Spotify.
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: The state parameter for CSRF protection.
 *     responses:
 *       302:
 *         description: A successful redirect to the frontend application with a JWT in the query params.
 *       400:
 *         description: State mismatch or other error.
 */
router.get('/callback', authController.callback);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     description: Retrieves the profile of the currently authenticated user. (Protected route - requires JWT)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data.
 *       401:
 *         description: Unauthorized.
 */
router.get('/profile', protect, authController.profile);

module.exports = router;
