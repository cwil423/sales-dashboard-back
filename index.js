const express = require('express');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const oauthRoute = require('./routes/oauth');
const quickbooksRoute = require('./routes/quickbooks');
const salesRoute = require('./routes/sales');
const inventoryRoute = require('./routes/inventory');
const usersRoute = require('./routes/users');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(express.json());

app.use('/oauth', express.static('public'));
app.use('/oauth', oauthRoute);
app.use('/quickbooks', quickbooksRoute);
app.use('/sales', salesRoute);
app.use('/inventory', inventoryRoute);
app.use('/users', usersRoute);

app.get('/', (req, res) => {
  res.send('home');
});

const port = process.env.Port;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
