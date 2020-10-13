const express = require('express');
const axios = require('axios');
const pool = require('../db');

const router = express.Router();

// Attempts to enter invoice into quickbooks, if this succeeds it enters into postgres.
router.post('/invoice', async (req, res) => {
  const { customer, salesperson, items } = req.body.invoice;
  let totalPrice = 0;

  items.forEach((element) => {
    totalPrice += element.product.price * element.quantity;
  });

  console.log(totalPrice);

  const line = items.map((item) => {
    const { quantity, price } = item;
    const total = item.price * item.quantity;
    return {
      DetailType: 'SalesItemLineDetail',
      // Amount: totalPrice,
      Amount: total,
      SalesItemLineDetail: {
        // Qty: quantity,
        // UnitPrice: price,
        Qty: quantity,
        UnitPrice: price,
        ItemRef: {
          name: 'Services',
          value: '1',
        },
      },
    };
  });

  let success = null;
  const token =
    'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..0b9TgC5aanhzYYnP77cEJg.valFZiPWlp8J-SxjkNRSsz3IfAM-oeS3TxVZ3WEZTZ8i2PEWYlUXkWogIkcvuW70LRCKSsshJLWOtk5X0rnTPSqpJUinRVRRHfjOYNxPeC573xIMiLv0DyR0DH9gxv5pQPryQQeKnHp6z4D5Zhtm0sdlslQJa39vx41Uasuu7ls95yOzo0C4p9eS6sa8FFap8AzkBnQnO7OL0VFsp6w_nj-0TgRwrK4o08QwcyhHHZbusLqA-1eFKNwJV9dqM0MRO1Dx3vGZv9SF6dkcTo1ekX9VD16wKwGYSC-h6A1KaDxjvFcMvZHUrTp8pRwJehTI8S5VauKh-xzIyh7CI4LjuD6hbFcAz43vx6OhJ6HCxMaulYiLM6CN5JMC9AEe-e-eGbIHU0L2qt-lE1ojvF6D2MyIyQ19OA21_ebtLkduPZoNZw6TAPcox2f1SlZKelBJSc9nGqb2JhvxTLl7ObFjV3Zf9wivfBCFhfOWweVNXvezU94ngj7Uc5BFkj8N0cXq1wh6JbeKeJ-omXhSuhGc8qG5lTI9wk8DIWQpdBhrrcHAtEqKzyQQXAhMdVhV3CZpGrqe7Os6d_pPzgE5y5X9OcMJ_YobUP89FhunGR_-peSqEnicvSswr1Qw8fwrDBxu_Rucsvnr-HeLjTW3jlOlRCKIV5ZXq5NA-cAgWwozcECAYLmR2xc-HT38bxyxxP2cKorlAHvjzIGEsiy8XcGZhlhZeCoayYsYbL250Az9i93lk3QpXGj2yrcYF-flVb-kXnoDfCRirUBWMaZHSiYxI1FclxomdBiWCo-NS-iyt02y59z39CA4IUJOal7Qz5hpwfwYUJj0wwzfbBGQHNwlzg.UJRfaCxbZgfDNc0q8WZOQw';
  await axios({
    method: 'post',
    url:
      'https://sandbox-quickbooks.api.intuit.com/v3/company/4620816365064691660/invoice?minorversion=54',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      Line: line,
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
