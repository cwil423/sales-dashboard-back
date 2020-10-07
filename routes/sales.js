const express = require('express');
const axios = require('axios');
const pool = require('../db');

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

router.post('/invoice', async (req, res) => {
  const {
    customer,
    salesperson,
    product,
    price,
    quantity,
    serviceDate,
  } = req.body.invoice;
  const totalPrice = price * quantity;
  console.log(customer, salesperson, product, price, quantity, serviceDate);
  let success = null;
  const token =
    'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..Z_xjIrhvYd4AAyRuocPazg.k6cs7dP-L9vXIRA9ZWcmrWMxHe35GP46oBg-YyFLVF2o6V-P_PChHxI6catJAT3pLxny_dQCd7VCZA_0FPMjwJhWKpMqCpV7vHItNQokupo0aJuB0wYHa7hRiF-kDBWmTwJpNGOhlNNYvFcqJdXgAnuOBgkPKaXzowAeg2GgqJZu7BE2lbXQbvvfnietcwffitWOnjwn2B6hMIQGOjCTGAvvPgKMZqGPzjT-EeBg13NZIha8F8m70rtFnSSAcwjTakPPSChn2KeE0s04sNov7b1uTMn1HMk4TjtNWbtwxYmTRVx-W1HRa0SNUHJJTQAKO1BsONwe-zPlrXzyhDLtD7dQBnMky9e6_O31m_OZFry1Blquc4O3KYShXHGNeZpYg4RjR1_2BLNNB_jrbSKx_EhiFf3jPiq2NIp1NomxLjf-F1vL3ByXiV7e_4-P2snv4Hzu8nm8NRJao2SVGSVW3uuf-Jd_NzvdYvt1wfTQwGQ920wCx9nKrh9UxtKZkMXuQCVXjRBqdT2OvnoCqJN_pOTnKJE4nPt4L1Z64NYo8IpeZb90cgrVWPcvCNKHk1G0elwu0ujgTnhulYjdVFwjG1QPoTWRPLgAJa6TR_n414KJPG936NbchehGgnML4jSvZuHg-CEC986niOd8Jb7lJqAW6wANd3LCtwX0N-IwbV2LbpmAXvvc4StPJ2MO9FPSeCMoDO0lLqVTQwlzOalhxPGbB9oukjlGeRl8vAXFUvv4yDQmNWC-pLQ02Pf566EahZY2fIB6byVgoS-hhT7kyENVGEeFH9ttNVLcqiJJw_NC-1mfkKT8M6mfGCo9x7hcAEVCcVA0Vl9z8lFSZ8b_vA.tISNiCH_AXCDM6iRbQAY6A';
  await axios({
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
          Amount: totalPrice,
          SalesItemLineDetail: {
            Qty: quantity,
            UnitPrice: price,
            ItemRef: {
              name: 'Services',
              value: '1',
            },
          },
        },
        // {
        //   DetailType: 'SalesItemLineDetail',
        //   // Amount: quantity,
        //   SalesItemLineDetail: {
        //     ServiceDate: serviceDate,
        //     Qty: quantity,
        //     UnitPrice: price,
        //     ItemRef: {
        //       name: product.product_name,
        //       // value is the account or type of service
        //       value: '1',
        //     },
        //   },
        // },
      ],
      CustomerRef: {
        // need to change to customer id
        value: '1',
      },
    },
  })
    .then(() => {
      success = true;
    })
    .catch((err) => {
      console.log(err);
      res.send(err);
      success = false;
    });
  if (success) {
    console.log('success');
    try {
      const dbInvoice = await pool.query(
        `INSERT INTO SALES (customer_id, salesperson_id, product_id, price, quantity, service_date)
        VALUES (${customer.id}, ${salesperson.id}, ${product.id}, ${price}, ${quantity}, '${serviceDate}')`
      );
      res.send('Success');
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }
});

router.post('/customers', async (req, res) => {
  try {
    let { letters } = req.body;
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
    let { letters } = req.body;
    letters = letters.charAt(0).toUpperCase();

    const salespeople = await pool.query(
      `SELECT * FROM salespeople WHERE first_name LIKE '${letters}%';`
    );
    res.send(salespeople.rows);
  } catch (error) {
    console.log(error);
  }
});

router.post('/products', async (req, res) => {
  try {
    let { letters } = req.body;
    letters = letters.charAt(0).toUpperCase();

    const products = await pool.query(
      `SELECT * FROM products WHERE product_name LIKE '${letters}%';`
    );
    res.send(products.rows);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
