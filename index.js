require('dotenv').config();
const express = require('express');
const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.APP_PORT || 3000;

// Body parser
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('<h1>Welcome to Express.js!</h1>');
});

app.use(webRoutes);
app.use(apiRoutes);

// Only listen if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
