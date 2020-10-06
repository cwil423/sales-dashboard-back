const express = require('express');
const pool = require('../db');
const axios = require('axios');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { sale } = req.body;
    const newSale = await pool.query(
      `INSERT INTO sales (customer_id, salesperson_id, service_date) 
      VALUES (1, 1, '2001-10-05')`
    );
    res.json(newSale);
    // const sales = await pool.query('SELECT * FROM salespeople');
  } catch (error) {
    console.log(error);
  }
});

router.get('/invoice', (req, res) => {
  const token =
    'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..XL2d6cqIS1AqysxTdm0yOw.DxeaPpiHxnECIj2MOVcV83MX8H4HTOy5FjqazXyR4G_3JQC289_XoOCh-c8ilJtf5eclsI9HFXwPJmKxCInwxt1Ga4P63xYLRsXpCFJBAxoTqQWq37ke9Jkw2TnT2TL-30L6FrfBJPIpzZEGbpBeJuowQTBPSyG3ty1JAeWge6WTyXGWAIE_cNWZQoRfkUKdZRv5bsq14fEinahmpGB_1kf1XrllfoGeWGNYRvotyUFzm92YvCV1Nn6j-0TLQHfCpL1rUOlZqaODV6uJdZH3KzJ24UtWZ2Whsy8qSBpoq1rtD3utMZ2uMC6Szqf5tuXfKj3p0Amxvib6itfEtrO_rOcv7KTdOlTZ_g8Z2R-MxbxJ5QxZBx3ZRAZIbyXt4E3i10YYynJY2s98wWXXHo7lkh49JAkp7n-chw0fne5Yq8Hb8Zf60lm4gRSenXt-PjjmEjXk4MiP1cTsKZae_CTBQFJ3L5AfDLukG9OGJCSFW1MFUNN5xufuj3PR0nrXa67-Kd4qOxp6z95UZXD7m-ukvSCfSSzKNSuU2WWgo8Ujgkaty37q7pmfihPYYzvNjw6hevQAc7OPqOqLRqqkQ4-p0_idg7Qi1k3k2EFTbpapjmcZTaAboqOrU52FQXDn0mL9d3SAwpj_5_-AjjWy5D8q7Mp3Lydyaf17vyDnfYdrOdmapLa9nxL_W7PTI007El8fOdaTGQDs0eRHFf8tj9Yfr6_DzLWW51ZMj7MWMI1-8S6Z7OR3z-C2S5-yFY8GTYraRAeimOjKUrwZqsRz2sIflT7ROaujyIpHf2p2aa8km0sUZo6K_fd6EN36M_fby8ypURy_9TkGpFPIEAqRRiZSKw.hr7RsKO3lEZbABuPWSCdQA';
  axios({
    method: 'post',
    url:
      'https://sandbox-quickbooks.api.intuit.com/v3/company/4620816365064691660/invoice?minorversion=54',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      Line: [
        {
          DetailType: 'SalesItemLineDetail',
          Amount: 69.0,
          SalesItemLineDetail: {
            ItemRef: {
              name: 'Services',
              value: '1',
            },
          },
        },
      ],
      CustomerRef: {
        value: '1',
      },
    },
  })
    .then((response) => console.log(response))
    .catch((err) => console.log(err));
});

router.post('/customers', async (req, res) => {
  try {
    let letters = req.body.letters;
    letters = letters.charAt(0).toUpperCase();

    const customers = await pool.query(
      `SELECT * FROM customers WHERE first_name LIKE '${letters}%';`
    );
    res.send(customers.rows);
  } catch (error) {
    console.log(error);
  }
});

router.post('/salespeople', async (req, res) => {
  try {
    let letters = req.body.letters;
    letters = letters.charAt(0).toUpperCase();

    const salespeople = await pool.query(
      `SELECT * FROM salespeople WHERE first_name LIKE '${letters}%';`
    );
    res.send(salespeople.rows);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
