const express = require('express');
const { format } = require('date-fns');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const { month, year } = req.body;

  const inventory_forecast = await pool.query(
    `SELECT SUM (number_of_filters), products.product_name FROM inventory_forecast
    JOIN products on inventory_forecast.filter_id = products.id
    WHERE EXTRACT (MONTH FROM sale_date) = ${month}
    AND EXTRACT (YEAR FROM sale_date) = ${year}
    GROUP BY product_name`
  );
  res.send(inventory_forecast.rows);
});

router.get('/forecast', auth, async (req, res) => {
  const currentYear = format(new Date(), 'yyyy');
  const currentMonth = format(new Date(), 'MM');
  const sums = [];
  const months = [];

  for (let i = 0; i < 6; i++) {
    const forecast = await pool.query(
      `SELECT SUM (sales_products.quantity), products.product_name
      FROM sales_products
      INNER JOIN forecasts ON sales_products.sales_id = forecasts.sale_id
      INNER JOIN products ON products.id = sales_products.product_id
      WHERE forecast_date < date '${currentYear}-${currentMonth}-01' + interval '${
        i + 1
      } months'
      AND forecast_date >= date '${currentYear}-${currentMonth}-01' + interval '${i} months'
      GROUP BY products.product_name`
    );
    sums.push(forecast.rows);
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

router.post('/enter', auth, (req, res) => {
  res.send('yes');
});

module.exports = router;
