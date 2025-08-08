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
 *     description: Allows an authenticated user to claim their airdrop by providing a payment transaction hash. There is a 3-day cooldown period between claims.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionHash
 *             properties:
 *               transactionHash:
 *                 type: string
 *                 description: The hash of the payment transaction on the Base network.
 *                 example: '0x123...'
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
