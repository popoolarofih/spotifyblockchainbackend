require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerConfig');

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
const authRoutes = require('./routes/auth');
const airdropRoutes = require('./routes/airdrop');
app.use('/auth', authRoutes);
app.use('/airdrop', airdropRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start Server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
