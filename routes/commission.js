const express = require('express');
const axios = require('axios');
const { format } = require('date-fns');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/year', async (req, res) => {
  const currentYear = format(new Date(), 'yyyy');
  const commission = await pool.query(
    `SELECT SUM(weighted_amount) FROM weighted_sales, users
    WHERE salesperson_id = users.id
    AND EXTRACT(YEAR from sale_date) = ${currentYear}`
  );
  res.send(commission.rows[0]);
});

router.get('/month', async (req, res) => {
  const currentYear = format(new Date(), 'yyyy');
  const currentMonth = format(new Date(), 'MM');
  const commission = await pool.query(
    `SELECT SUM(weighted_amount) FROM weighted_sales, users
    WHERE salesperson_id = users.id
    AND EXTRACT(MONTH from sale_date) = ${currentMonth}
    AND EXTRACT(YEAR from sale_date) = ${currentYear}`
  );
  res.send(commission.rows[0]);
});

router.get('/pastSixMonths', auth, async (req, res) => {
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
      `SELECT SUM (weighted_amount) FROM weighted_sales, users 
      WHERE sale_date >= date '${currentYear}-${currentMonth}-01' - interval '${
        i + 1
      } months' 
      AND sale_date < date '${currentYear}-${currentMonth}-01' - interval '${i} months'
      AND salesperson_id = users.id`
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

router.get('/report', auth, async (req, res) => {
  const report = await pool.query(
    `SELECT users.id, first_name, last_name FROM weighted_sales, users `
  );
  res.send(report);
});

module.exports = router;
