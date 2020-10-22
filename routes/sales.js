const express = require('express');
const axios = require('axios');
const pool = require('../db');

const router = express.Router();

// Attempts to enter invoice into quickbooks, if this succeeds it enters into postgres.
router.post('/invoice', async (req, res) => {
  const { customer, salesperson, products, frequency, bulk } = req.body.invoice;
  let totalPrice = 0;

  products.forEach((element) => {
    totalPrice += element.product.price * element.quantity;
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

  let success = false;
  const token =
    'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwiYWxnIjoiZGlyIn0..e9MkA7eEoSOEUkUSKpICjA.D8sPMEmIF7-76MYZB0GynvKwYmnn4wk-K8qQPjLhbQFIKyR6U9knJVta8xtZLrXSNWztbi-tw_fceg-7q0kyOvEqx1MucqjvXVw15UGjIhF1tgXoxll8bY3ogophehsyjv8v7sXepS-y_zF5sNgTqP3V1JJyl__eskpuk6mQPLpPTGepaM7a5RjQGP93xHtobHURkFtC8W6GROBXdYYdYp25gOGK_oQDfodC4GaNW3pha8iFdJ_r5BpGNG-y7gNQX6wzifOWgNEuGrctdmS45ISIrClnW48-HCSVsxLBDNad0aVGBSNwUK0DSm0ykTyMpXT-8Xlg4b4hNaYopBNMmSfSZMttu2sqhyLWrXPxXeyM94FPNBiqTd3KZjk-o9vPmisO7hvuXpOcVKG0yCWJKoYr2Hgip_mDcNO1aOFNUAOCo5Wzli_Fnv_lFbk7tX5nTk20e-INHNZn8MOi5R10o3LW7iYZP_yHrNv0hpdtSx3nhLLkZB_FRHN-lV6BSw-LItrdkQtDGX6DQ1j-9OjwIr_eigHkVK2R56cMp5So3UYHLMfV2gxlW5vECXAto3RAj5gsOPQX8nW0v3I8814tFuJbozssGuGNVethPPOTC6VaUE-kMj9vqA_qSRv3mMaO4RjhoZh1hj4g4PKUfmtqltBL-36eyZwX25IQpvgfUO873YKkv3Jv2xIAP3phQ-V7IbxqBsGPX97U9Eaarr41ZflSprG9cvgMDUEttX5yl8vdy4xHynOLwzZR9-wlx6UftMlFuGraXiZSc8Vqw_rQQpbk9puoYhIVgOgCKDxsmSpwyHtLsnH_xH3TUk9wZPpp69Ispw05LualcdG3W6-YNg.SP53Gh1A2wiYW2wp1zfm8w';
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

      products.forEach(async (item) => {
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
