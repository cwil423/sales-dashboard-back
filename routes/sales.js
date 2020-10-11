const express = require('express');
const axios = require('axios');
const pool = require('../db');

const router = express.Router();

// Attempts to enter invoice into quickbooks, if this succeeds it enters into postgres.
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
    'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..f0SwEPeAQaXTVEpmeZ7BhA.xpaDitfV-e5v7doi9eEKNP_w8iUpGt5xNAcFapkXeGrjo3YiBN2MDzc6mhit-6U5NmwrRG-5SbcBWF2F9oFcN-p_W2tVxT2prSiPOcnEoNRSoaV4H7b06EhIFG-J9VWn-81QtxrOOaNW0pK98f2f1n65Nlwr4ASmRbOOMATzOPssskpghXIzjqMmCUpc6sLmkpUe7zfAR11FCaXRmuMTGGDGmpCKpekW6NfcQNqxc85RjobgDA5Kb77rghfG9MSqKUJRRiJMLEq-tsIHv5nDaOXYs06opovAxterT9fqM-l74AV1Spzc1X8EAOGD5MXC5T_avncEFuGtzqK1lyQ1VVgXoBjpiSncGrKSWSBifZdLEgg6CTMC9AO6GJcdg3-_0cLSl_chTFJJ-LytUOtZv-lVr98EDImTj6LlZ-8DgMaVUiR3hNEm-eXHMpH3YZkHdS1wq-twbMNNiAQAuOMPw_Z1s39Tgix194OQEoHVgHfBgEPgcFKR3ZesJzGs3l0iiLF2H-zjzSsR_ZEKzqRt2TrWJD1NN1ePbTGxS38blU1Iyh7ijvef_gtZP7o9qnDXg51E7-BBHuAm0GAPzTL2HojJgrJMFJ7BI8m4ngsOzFzSxZy55T95OAh3_UTtApRGTj04gSsWAY3iKPaH9N8chLZ5QLYgDpoowI4sCHUyhJN4xOLg8QAWyI4LavPxjK9Bb2yF6ZB8K2pcGEKv4RUbsQPTqls15rkRcGXmqzZOpJquTk1Am88BpiiW4zCNe7r0vkZVReqoTiUgMe4NwIuOQ0jLAfHuncP8sz9irHYE6viJgumqgwib5k0g8evpET8I5hKvrfcluD34VgweT79SUw.0iO2pdvq3hfpUqY05KIMpQ';
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

// Fetches customers, salespeople or products from postgres.
router.post('/data', async (req, res) => {
  try {
    const { type } = req.body;
    let { letters } = req.body;
    letters = letters.charAt(0).toUpperCase();

    let column = null;

    if (type === 'products') {
      column = 'product_name';
    } else {
      column = 'first_name';
    }

    const data = await pool.query(
      `SELECT * FROM ${type} WHERE ${column} LIKE '${letters}%';`
    );
    res.send(data.rows);
  } catch (error) {
    console.log(error);
  }
});

// Fetches totatl of all invoices from postgres.
router.get('/total', async (req, res) => {
  const invoiceTotal = await pool.query(`SELECT SUM (total_price) FROM sales`);
  res.send(invoiceTotal.rows);
});

module.exports = router;
