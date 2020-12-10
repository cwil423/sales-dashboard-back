const express = require('express');
const axios = require('axios');
const pool = require('../db');
const bcrypt = require('bcrypt');
const { userinfo_endpoint_sandbox } = require('intuit-oauth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password, isSalesperson } = req.body;

  try {
    const checkIfUserExists = await pool.query(
      `SELECT email FROM users WHERE email = '${email}'`
    );

    // If no users are returned create user.
    if (checkIfUserExists.rows.length < 1) {
      const hashedPassword = await bcrypt.hash(password, 10);
      try {
        const newUser = await pool.query(
          `INSERT INTO users (first_name, last_name, email, password, is_salesperson)
          VALUES ($1, $2, $3, $4, $5)`,
          [firstName, lastName, email, hashedPassword, isSalesperson]
        );
        res.status(201).send();
      } catch (error) {
        res.status(500).send();
      }
    } else {
      res.status(400).send('User already exists');
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query(
      `SELECT * FROM users WHERE email = '${email}'`
    );
    try {
      if (user.rows[0]) {
        if (await bcrypt.compare(password, user.rows[0].password)) {
          res.status(200);
        } else {
          res.send('Incorrect email or password');
        }
      } else {
        res.send('Incorrect email or password');
      }
    } catch (error) {
      res.status(500).send();
    }
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
