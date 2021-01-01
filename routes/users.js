require('dotenv').config();
const express = require('express');
const axios = require('axios');
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
      res.send('User already exists');
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

// router.post('/token', (req, res) => {
//   const refreshToken = req.body.token;
// });

router.post('/login', async (req, res) => {
  console.log(req.body.email);
  const { email, password } = req.body;
  try {
    const user = await pool.query(
      `SELECT * FROM users WHERE email = '${email}'`
    );
    try {
      if (user.rows[0]) {
        if (await bcrypt.compare(password, user.rows[0].password)) {
          const accessToken = jwt.sign(
            { email },
            process.env.ACCESS_TOKEN_SECRET,
            {
              expiresIn: '15m',
            }
          );
          const refreshToken = jwt.sign(
            email,
            process.env.REFRESH_TOKEN_SECRET
          );

          res.json({ accessToken, refreshToken });
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
