const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check for the service and its dependencies
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check the health of the service
 *     tags: [Health]
 *     description: Returns the current status of the server and its dependencies, such as the database and blockchain provider.
 *     responses:
 *       200:
 *         description: All services are running correctly.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 serverTime:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                   example: OK
 *                 dependencies:
 *                   type: object
 *                   properties:
 *                     supabase:
 *                       type: string
 *                       example: OK
 *                     baseNetwork:
 *                       type: string
 *                       example: OK
 *       503:
 *         description: One or more services are unavailable.
 */
router.get('/', healthController.checkHealth);

module.exports = router;
