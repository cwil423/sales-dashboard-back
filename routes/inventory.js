const express = require('express');
const { format } = require('date-fns');
const pool = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const currentYear = format(new Date(), 'yyyy');
  const currentMonth = format(new Date(), 'MM');
  const { monthsAhead } = req.body;
  const blah = '';

  console.log(req.body);

  const inventory_forecast = await pool.query(
    `SELECT * FROM inventory_forecast
    JOIN products on inventory_forecast.filter_id = products.id
      WHERE sale_date < date '${currentYear}-${currentMonth}-01' + interval '${
      monthsAhead + 1
    } months'
      AND sale_date > date '${currentYear}-${currentMonth}-01' + interval '${monthsAhead} months'`
  );
  res.send(inventory_forecast.rows);
});

module.exports = router;
