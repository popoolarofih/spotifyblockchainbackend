const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization via Twitch
 */

/**
 * @swagger
 * /auth/login:
 *   get:
 *     summary: Login with Twitch
 *     tags: [Authentication]
 *     description: Redirects the user to the Twitch authentication page to grant permission. If a `ref` query parameter is provided, it will be used to track the referral.
 *     parameters:
 *       - in: query
 *         name: ref
 *         schema:
 *           type: string
 *         description: An optional referral code.
 *     responses:
 *       302:
 *         description: A successful redirect to Twitch's login page.
 */
router.get('/login', authController.login);

/**
 * @swagger
 * /auth/callback:
 *   get:
 *     summary: Twitch authentication callback
 *     tags: [Authentication]
 *     description: This is the callback URL that Twitch redirects to after user authentication. It handles the code exchange and user creation/login. The user is then redirected to the frontend with a JWT.
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: The authorization code returned from Twitch.
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
