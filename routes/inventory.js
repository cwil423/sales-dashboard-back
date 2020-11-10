const express = require('express');
const { format } = require('date-fns');
const pool = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  // const currentYear = format(new Date(), 'yyyy');
  // const currentMonth = format(new Date(), 'MM');
  const { month, year } = req.body;

  const inventory_forecast = await pool.query(
    `SELECT SUM (number_of_filters), products.product_name FROM inventory_forecast
    JOIN products on inventory_forecast.filter_id = products.id
    WHERE EXTRACT (MONTH FROM sale_date) = ${month}
    AND EXTRACT (YEAR FROM sale_date) = ${year}
    GROUP BY product_name`
  );
  console.log(inventory_forecast.rows);
  res.send(inventory_forecast.rows);
});

module.exports = router;
