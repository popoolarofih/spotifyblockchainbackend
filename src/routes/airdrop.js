const express = require('express');
const router = express.Router();
const airdropController = require('../controllers/airdropController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Airdrop
 *   description: Airdrop claiming operations
 */

/**
 * @swagger
 * /airdrop/claim:
 *   post:
 *     summary: Claim the airdrop
 *     tags: [Airdrop]
 *     description: Allows an authenticated user to claim their airdrop. There is a 3-day cooldown period between claims.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Airdrop claimed successfully.
 *       400:
 *         description: Cooldown period has not passed.
 *       401:
 *         description: Unauthorized.
 */
router.post('/claim', protect, airdropController.claim);

module.exports = router;
