const express = require('express');
const axios = require('axios');
const pool = require('../db');
const { route } = require('./quickbooks');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const newSale = await pool.query(
      `INSERT INTO sales (customer_id, salesperson_id, service_date) 
      VALUES (1, 1, '2001-10-05')`
    );
    res.json(newSale);
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
  let success = null;
  const token =
    'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..Up7x_gR6EQ9uU68s7lwYlw.zDSyGW-lv1pCnJwLO1J0YpBnjoE5yrxAU4yErVbsrVSFZ1xY-6TAGFFPwuNsJSTvGwsh6I9ynmlaqBtZ3KJGAU2p2CK-cQgmCSkAY2oJYWJ9-3Kbc6ROek_soDIhHHLq8zN4hqu7UG2GOFKjdREIzocylvX_a1iGOHF37XlsIo_b_hYa19bIFxN0CVIeR3PvxCC4BAI1PlTMMRWgU6xLnulcRwfXsI6SACJRdQgbTB6uvx6YmE5iET73GyiYkfYwnPYDEpaeHaK2J_hKfOIrzkcx7fQ5XRRsoDeYsFd9nT5YWGpa1vR9jpv7z38QOuTxt193q5_5UsDi1pylimg4-ExNv980KTrTDM5nHSBAtxqfES-wFTMtaau4WnByK1AueN0IUPN4GwuD1BDomMJc79NiWXGLu1TJr0xpnxZJe39clBAY9G9NcAAha5sVV4qZ-_So-ablzRiE3kvabqPGfBwINHG7V-WKY9OPWGSTxMLKP3DS6AGhjREYigwydW3_7Tn0jUuL2MyBi8CLHPgrn9lGpseqBIhwSKsPgOQThi1THBsVHU9FewzCoipoLgd6A36SjzEn8HEe4PLIxMlN3hqxv3vN3sCwPCEjUnFWCsxmY6bRGCXHYBtjGVM8SVzli6cSaDQuUBHevDiIol2i1eNDfxfzRpYyJ2oG-bnRdCKhsOEgk5xd7vDm0iH_7M7HU7rbkQlGXajSCyFA1gl_TsBb_pa2s9-lZdZlQHbuMjRz4Gn3Uded8c6JrnXIiBF0baA0ZDkV7i8HrWxlvzmt_kZuCYnQx73F4TtNly-I5s3mJdLK0zQ5Y_tErTfwiVGNpmNbm2dP6vCgH0Vlta0Ibg._kaOJjo72HsJz3y4bTholQ';
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
      res.send(err);
      success = false;
    });
  if (success) {
    try {
      const dbInvoice = await pool.query(
        `INSERT INTO SALES (customer_id, salesperson_id, product_id, price, quantity, total_price, service_date)
        VALUES (${customer.id}, ${salesperson.id}, ${product.id}, ${price}, ${quantity}, ${totalPrice}, '${serviceDate}')`
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

router.get('/total', async (req, res) => {
  const invoiceTotal = await pool.query(`SELECT SUM (total_price) FROM sales`);
  res.send(invoiceTotal.rows);
});

module.exports = router;
