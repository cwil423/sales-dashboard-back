const express = require('express');
const axios = require('axios');
const pool = require('../db');

const router = express.Router();

// Attempts to enter invoice into quickbooks, if this succeeds it enters into postgres.
router.post('/invoice', async (req, res) => {
  const { customer, salesperson, items, frequency, bulk } = req.body.invoice;
  let totalPrice = 0;

  items.forEach((element) => {
    totalPrice += element.product.price * element.quantity;
  });

  const line = items.map((item) => {
    const { quantity, price } = item;
    const total = item.price * item.quantity;
    return {
      DetailType: 'SalesItemLineDetail',
      Amount: total,
      SalesItemLineDetail: {
        Qty: quantity,
        UnitPrice: price,
        ItemRef: {
          name: 'Services',
          value: '1',
        },
      },
    };
  });

  let success = true;
  const token =
    'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..bwtyLz9hILcBDzYKkAxV3g.oxFSzRb39nIe-_3NVfx2wYOMfG5fCp9ZPZ2IB6eZAEm2XeMy8LLM1yuZEtBWLj2ovzc7c-lpV3i1pcBGvLCrDWUJpVM8FtvzcudhvFYfD7kWV4ZsYY_Xy8z7Li9resNpJJMpjD0D7DZ-CBSlZbH8RfpnmcfHoZuGJ5Zx1dIKZNrHAzOWUMfvepJRA8LZX3d3C1W-0p3dh2ORFQpMd6drPm94yw056ZxWkpObNZpGyt25wXK5iOPdFf-UAlY6fz4B6hkubJ_nBLc40DOjOYkv2aAZOESrx2PHRUD6t8tzjvGBqL-841QERrErROGjGqxy3KbM-xV0s4dLfpzMyPdDBbZ7SCuL0qi0LKfh381X2dyu28IuuPen1Jiz2TLOJAMx97Ohmtu1Pt67Pv8YbUjVwotjvocwq-E7FLydJXHPvOtNZfg7JFPrWILV9CuCAj1ElVvrYXNalvZA8TvTWeFr7PIVXrq8b7ILcNJ-8j7u3z5KeNKkIm3na1Qagf-Zv_wyLT-m-fnoypUfNNsV-lE5zHLz8eP3j4Lycld4Qc3ZevnaJRaZUGU5sbfPvwSJCV_-CGbqR7KaW8wiE2qBkaJ0KMIwGNENS-MM4xWrb4NFu6zOT4fFAczSjIhfkLLo7sjojFiEt61wBOUNf2Bh4Wysi64TVH2_BakJszgCYvdVt8rl5xRLjlqTS5bV6mNlVcZVB2JEKGxylbRYlDSa_GfzNs0PiV2FBhupmWqfpOhRXHClAk5gmROCjaK7Sm9i-TwmtKgMbNDwLeE1C-WPR9xWQRH06JgS543UobizrOk95X-JopoGT5THnpLIgvxhfi2G9u3PSGamz9AHwZ1KWNef3Q.Ca-sExute8127UW-3yc_oQ';
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
        `INSERT INTO sales (customer_id, salesperson_id, invoice_date)
        VALUES (${customer.id}, ${salesperson.id}, '08/20/2020') RETURNING id`
      );
      const invoiceId = dbInvoice.rows[0].id;

      items.forEach(async (item) => {
        const quantity = parseInt(item.quantity, 10);
        const price = parseFloat(item.price);
        const dbSaleProduct = await pool.query(
          `INSERT INTO sales_products (sales_id, product_id, quantity, price, total, frequency, bulk)
          VALUES (${invoiceId}, ${item.id}, ${item.quantity}, ${item.price}, ${
            quantity * price
          }, ${frequency}, ${bulk})`
        );
      });
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
  const invoiceTotal = await pool.query(
    `SELECT SUM (total) FROM sales_products`
  );
  res.send(invoiceTotal.rows);
});

module.exports = router;
