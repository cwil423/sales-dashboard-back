const express = require('express');
const session = require('express-session');
const { v4: uuidv4} = require('uuid')
const sql = require('mssql');
const bodyParser = require('body-parser');
const pool = require('./db');
const cors = require('cors');

require('dotenv').config()

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.use(session({
  genid: (req) => {
    return uuidv4()
  },
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: true }
}));


const oauthRoute = require('./routes/oauth');
const quickbooksRoute = require('./routes/quickbooks');
const salesRoute = require('./routes/sales');
app.use('/oauth', express.static('public'));
app.use('/oauth', oauthRoute);
app.use('/quickbooks', quickbooksRoute);
app.use('/sales', salesRoute);

app.get('/', function (req, res) {
 res.send('home')
});
 
const port = process.env.Port;

app.listen(port, ()=> {
  console.log(`Listening on port ${port}`);
});