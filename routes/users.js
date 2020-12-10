const express = require('express');
const axios = require('axios');
const pool = require('../db');
const bcrypt = require('bcrypt');

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
        res.status(400).send();
      }
    } else {
      res.send('User already exists');
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const passwordFromDatabase = await pool.query(
      `SELECT password FROM users WHERE email = '${email}'`
    );
    console.log('query successful');
    try {
      if (
        await bcrypt.compare(password, passwordFromDatabase.rows[0].password)
      ) {
        res.status(200).send('Success');
      } else {
        res.status(401).send('Incorrect password');
      }
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    res.status(500).send('really bad');
  }
});

module.exports = router;
