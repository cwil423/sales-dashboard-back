const express = require('express');
const axios = require('axios');
const { format } = require('date-fns');
const pool = require('../db');

const router = express.Router();

// Attempts to enter invoice into quickbooks, if this succeeds it enters into postgres.
router.post('/invoice', async (req, res) => {
  const { customer, salesperson, products, frequency, bulk } = req.body.invoice;
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
        const dbSaleProduct = await pool.query(
          `INSERT INTO sales_products (sales_id, product_id, quantity, price, total, bulk, frequency)
          VALUES (${invoiceId}, ${item.product.id}, ${item.quantity}, ${
            item.price
          }, ${quantity * price}, ${bulk}, '${frequency.label}' )`
        );
        // const inventoryForecast = await pool.query(
        //   `INSERT INTO inventory_forecast (sales_id, sale_date, number_of_filters, filter_id)
        //     VALUES (${invoiceId}, CURRENT_DATE + INTERVAL '${frequency.monthsUntilNextDelivery} MONTHS', ${quantity}, ${item.product.id} )`
        // );
        if (frequency.weeksUntilNextDelivery) {
          for (let i = 0; i < 52; i += frequency.weeksUntilNextDelivery) {
            const forecasts = await pool.query(
              `INSERT INTO forecasts (sale_id, product_id, forecast_date)
                VALUES (${invoiceId}, ${item.product.id}, CURRENT_DATE + INTERVAL '${i} WEEKS')`
            );
          }
        }
        if (frequency.monthsUntilNextDelivery) {
          for (let i = 0; i < 12; i += frequency.monthsUntilNextDelivery) {
            const forecasts = await pool.query(
              `INSERT INTO forecasts (sale_id, product_id, forecast_date)
                VALUES (${invoiceId}, ${item.product.id}, CURRENT_DATE + INTERVAL '${i} MONTHS')`
            );
          }
        }
      });

      // for (let i = 0; i < frequency.monthsUntilNextDelivery; i++) {
      //   const newWeightedSales = await pool.query(
      //     `INSERT INTO weighted_sales (sales_id, sale_date, weighted_amount)
      //     VALUES (${invoiceId}, CURRENT_DATE + INTERVAL '${i} MONTHS', ${
      //       totalPrice / frequency.monthsUntilNextDelivery
      //     } )`
      //   );
      // }

      if (frequency.weeksUntilNextDelivery) {
        const newWeightedSales = await pool.query(
          `INSERT INTO weighted_sales (sales_id, sale_date, weighted_amount)
            VALUES (${invoiceId}, CURRENT_DATE, ${
            totalPrice / frequency.monthsUntilNextDelivery
          } )`
        );
      }
      if (frequency.monthsUntilNextDelivery) {
        if ((frequency.monthsUntilNextDelivery = 6 || 12)) {
          const newWeightedSales = await pool.query(
            `INSERT INTO weighted_sales (sales_id, sale_date, weighted_amount)
            VALUES (${invoiceId}, CURRENT_DATE, ${totalPrice / 2} )`
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
    res.send(error);
  }
});

router.get('/weighted', async (req, res) => {
  const currentYear = format(new Date(), 'yyyy');
  const currentMonth = format(new Date(), 'MM');
  const sums = [];
  const months = [];
  let currentSum = null;
  let currentMonthName = null;

  const currentWeightedSales = await pool.query(
    `SELECT SUM (weighted_amount) FROM weighted_sales
    WHERE EXTRACT (MONTH FROM sale_date) = ${currentMonth}`
  );
  currentSum = currentWeightedSales.rows[0];

  const currentWeightedMonth = await pool.query(
    `SELECT TO_CHAR(sale_date, 'Month') AS "Month" FROM weighted_sales
    WHERE EXTRACT (MONTH FROM sale_date) = ${currentMonth}
    LIMIT 1`
  );
  currentMonthName = currentWeightedMonth.rows[0];

  for (let i = 0; i < 6; i++) {
    const weightedSales = await pool.query(
      `SELECT SUM (weighted_amount) FROM weighted_sales 
      WHERE sale_date >= date '${currentYear}-${currentMonth}-01' - interval '${
        i + 1
      } months' 
      AND sale_date < date '${currentYear}-${currentMonth}-01' - interval '${i} months'`
    );
    sums.push(weightedSales.rows[0].sum);
  }

  for (let i = 0; i < 6; i++) {
    const weightedSalesMonths = await pool.query(
      `SELECT TO_CHAR(sale_date, 'Month') AS "Month" FROM weighted_sales
      WHERE sale_date >= date '${currentYear}-${currentMonth}-01' - interval '${
        i + 1
      } months' 
      AND sale_date < date '${currentYear}-${currentMonth}-01' - interval '${i} months' 
      LIMIT 1`
    );
    months.push(weightedSalesMonths.rows[0]);
  }
  res.send([sums, months, currentSum, currentMonthName]);
});

router.get('/forecast', async (req, res) => {
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

module.exports = router;
