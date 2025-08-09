require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true, // This allows cookies to be sent
};
app.use(cors(corsOptions));
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
