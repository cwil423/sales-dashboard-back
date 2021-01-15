const express = require('express');
const axios = require('axios');
const { format } = require('date-fns');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Attempts to enter invoice into quickbooks, if this succeeds it enters into postgres.
router.post('/invoice', async (req, res) => {
  const { customer, products, frequency, bulk } = req.body.invoice;
  const salesperson = req.body.user;
  console.log(req.body);
  const date = format(new Date(), 'yyy/MM/dd');

  let totalPrice = 0;

  products.forEach((item) => {
    totalPrice += parseFloat(item.price) * parseInt(item.quantity, 10);
  });

  const line = products.map((item) => {
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
  // const token =
  //   'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..LfNDu7V5rVis35Pv2ZoxPQ.TpqRKqf55hylr7ESH9ihJY3YirynAUHOmnPU_ykwBVCL9Mn1e7V9Dj_n4YoHP9H6xorPLpElpTLmg-JrvW5PF3MMd7PWSO-u8FEx-IPDR2MOcynoo3oyHufBYy5gsN768o6fICi1M9S_LEghGfcdAN_FFZCqit6jXFF70z1QqWSLde18HuN3qBwP9oOt5JJXLbkni2KeHWjWddps8xsX75zI8C7PVWtcPkodY4GIRGpqLS7X2g2mPBPBJyYGFhFyfDgjmvlvqSf6jdbFSRU87d72dkyjBTWVl_QUxREerHRjUzHDvWaPbPo06juSFr8uHpQWsy1BgMgeoGyK-S9MesBed-PJpgmT-cAyih5yab6nIAT5AdlZoyXMhzvA7sOTO2ZT5BTr2q9CNOkyCKrwELV5ZwXWZjyBql4PVRJYYG6TLstR_mak-zyLTc3E1TsUnKKLJMUdn6VvOcEEdVCezPxzAbSUytlD9uvxSChyVqyOHwihBsXisZpIfW2gYNJ-YR62QldNB5OoLzmUx2m2eASOLRcvQS2m_nU_GzGxRrYiQY46fK1t4r1iDG01lWXZGRzHkF6n9_PA_xGQQI4kPMdPtcWsG7hQB1yR-4cUi8grcAoqQOQwYo_qE-YU0voK6EoCM2zKMOhY1D458YqgkeYpfyPB5FrogvEryJiPvxfo2GGoVSsaSPv9aEpaV8qdsD6rLS3ChYgJ4uoZTNNMh5jPE6B-hLV8d5__c3T1NnpnEpZw7nOWnoYhsIKVlDP47ACODwCzE96N-RGBVrfaXpiX70hdV1AsB9oc6JxdmmzCMFnhpjurNCfdFCPZyUT0900-mxu6xBtfh6tueJLlBA.Wm8HHYqprI30equm_TcK4g';
  // await axios({
  //   method: 'post',
  //   url:
  //     'https://sandbox-quickbooks.api.intuit.com/v3/company/4620816365064691660/invoice?minorversion=54',
  //   headers: {
  //     Authorization: `Bearer ${token}`,
  //   },
  //   data: {
  //     Line: line,
  //     CustomerRef: {
  //       // need to change to customer id
  //       value: '1',
  //     },
  //   },
  // })
  //   .then(() => {
  //     success = true;
  //   })
  //   .catch((err) => {
  //     res.send(err);
  //     success = false;
  //   });
  if (success) {
    try {
      const dbInvoice = await pool.query(
        `INSERT INTO sales (customer_id, salesperson_id, invoice_date)
        VALUES (${customer.id}, ${salesperson.id}, '${date}') RETURNING id`
      );
      const invoiceId = dbInvoice.rows[0].id;
      products.forEach(async (item) => {
        const quantity = parseInt(item.quantity, 10);
        const price = parseFloat(item.price);
        const { saleDate } = item;
        console.log(item);
        const dbSaleProduct = await pool.query(
          `INSERT INTO sales_products (sales_id, product_id, quantity, price, total, bulk, frequency)
          VALUES (${invoiceId}, ${item.product.id}, ${item.quantity}, ${
            item.price
          }, ${quantity * price}, ${bulk}, '${frequency.label}' )`
        );
      });
      if (frequency.weeksUntilNextDelivery) {
        const newWeightedSales = await pool.query(
          `INSERT INTO weighted_sales (sales_id, salesperson_id, sale_date, weighted_amount)
            VALUES (${invoiceId}, ${salesperson.id}, CURRENT_DATE, ${
            totalPrice / frequency.monthsUntilNextDelivery
          } )`
        );
      }
      if (frequency.monthsUntilNextDelivery) {
        if (frequency.monthsUntilNextDelivery) {
          const newWeightedSales = await pool.query(
            `INSERT INTO weighted_sales (sales_id, salesperson_id, sale_date, weighted_amount)
            VALUES (${invoiceId}, ${salesperson.id}, CURRENT_DATE, ${
              totalPrice / frequency.monthsUntilNextDelivery
            } )`
          );
        }
      }
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

    if (type === 'products') {
      const data = await pool.query(
        `SELECT * FROM ${type} WHERE product_name LIKE '${letters}%';`
      );
      res.send(data.rows);
    } else if (type === 'users') {
      const data = await pool.query(
        `SELECT id, first_name, last_name FROM ${type} WHERE first_name LIKE '${letters}%';`
      );
      console.log(data.rows);
      res.send(data.rows);
    } else {
      const data = await pool.query(
        `SELECT * FROM ${type} WHERE first_name LIKE '${letters}%';`
      );
      res.send(data.rows);
    }
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.get('/forecast', auth, async (req, res) => {
  const currentYear = format(new Date(), 'yyyy');
  const currentMonth = format(new Date(), 'MM');
  const sums = [];
  const months = [];

  for (let i = 0; i < 6; i++) {
    const forecast = await pool.query(
      `SELECT SUM (total) FROM sales_products
      INNER JOIN forecasts 
      ON sale_id = sales_id
      WHERE forecast_date < date '${currentYear}-${currentMonth}-01' + interval '${
        i + 1
      } months'
      AND forecast_date >= date '${currentYear}-${currentMonth}-01' + interval '${i} months'`
    );
    sums.push(forecast.rows[0].sum);
  }

  for (let i = 0; i < 6; i++) {
    const weightedSalesMonths = await pool.query(
      `SELECT TO_CHAR(forecast_date, 'Month') AS "Month" FROM forecasts
      WHERE forecast_date < date '${currentYear}-${currentMonth}-01' + interval '${
        i + 1
      } months'
      AND forecast_date > date '${currentYear}-${currentMonth}-01' + interval '${i} months'
      LIMIT 1`
    );
    months.push(weightedSalesMonths.rows[0]);
  }
  res.send([sums, months]);
});

router.get('/income', async (req, res) => {
  const income = await pool.query(
    `SELECT SUM(total) FROM sales_products, sales
    WHERE invoice_date < CURRENT_DATE
    AND invoice_date > CURRENT_DATE - interval '1 year'`
  );
  res.send(income.rows[0]);
});

module.exports = router;
