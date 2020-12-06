const express = require('express')
const admin_auth = require('../middleware/admin_auth')
const controller = require('../controllers/image')

const router = express.Router();

router.get('/',
  admin_auth,
  controller.dispatch)

module.exports = router