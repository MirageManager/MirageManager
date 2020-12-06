const express = require('express')
const admin_auth = require('../middleware/admin_auth')
const host_val = require('../validators/host')
const controller = require('../controllers/host')
const unikernelRouter = require('./unikernel')

const router = express.Router();

router.get('/',
  admin_auth,
  controller.dispatch)

router.post('/',
  admin_auth,
  host_val.new,
  controller.dispatch)

router.get('/:host_id',
  admin_auth,
  host_val.update,
  controller.dispatch)

router.delete('/:host_id',
  admin_auth,
  host_val.update,
  controller.dispatch)

router.use('/:host_id/unikernels', host_val.update, unikernelRouter)

module.exports = router