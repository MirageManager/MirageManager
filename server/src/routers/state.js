const express = require('express');
const unikernel_auth = require('../middleware/unikernel_auth')

const connect = require('../middleware/unikernel_connect')
const state_val = require('../validators/state')
const controller = require('../controllers/state')

const router = express.Router();

router.post('/', 
  unikernel_auth,
  state_val.new,
  controller.dispatch
)

router.get('/latest',
  unikernel_auth,
  connect,
  state_val.update,
  controller.dispatch
)

module.exports = router


