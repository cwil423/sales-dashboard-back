const express = require('express');
const axios = require('axios');
const pool = require('../db');
const bcrypt = require('bcrypt');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, isSalesperson } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const newUser = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, is_salesperson)
      VALUES ($1, $2, $3, $4, $5)`,
      [firstName, lastName, email, hashedPassword, isSalesperson]
    );
    res.send('success');
  } catch (error) {
    res.send('error');
  }

  console.log(req.body);
});

module.exports = router;
