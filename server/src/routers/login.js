const express = require('express');
const router = express.Router();
const login_val = require('../validators/login')
const controller = require('../controllers/login')

router.post('/',
  login_val,
  controller.dispatch
)

module.exports = router