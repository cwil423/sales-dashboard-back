const express = require('express');
const axios = require('axios');

const router = express.Router();

router.post('/', (req, res) => {
  const letters = 'a';
  const query = encodeURIComponent(
    `select * from Customer WHERE DisplayName LIKE '${letters}%'`
  );
  axios({
    method: 'get',
    // url: `https://quickbooks.api.intuit.com/v3/company/123146543922004/query?query=${query}&minorversion=51`,
    url: `https://sandbox-quickbooks.api.intuit.com/v3/company/4620816365064691660/query?query=${query}&minorversion=51`,
    headers: {
      Authorization: `Bearer ${req.body[0].token}`,
    },
  })
    .then((response) => res.send(response.data.QueryResponse))
    .catch((err) => console.log(err));
});

module.exports = router;
