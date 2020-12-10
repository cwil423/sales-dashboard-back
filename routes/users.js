const express = require('express');
const axios = require('axios');
const pool = require('../db');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, isSalesperson } = req.body;
  const newUser = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password, is_salesperson)
    VALUES ($1, $2, $3, $4, $5)`,
    [firstName, lastName, email, password, isSalesperson]
  );
});

module.exports = router;
