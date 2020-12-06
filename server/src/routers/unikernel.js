const express = require('express')
const router = express.Router()

const admin_auth = require('../middleware/admin_auth')
const unikernel_auth = require('../middleware/unikernel_auth')
const unikernel_val = require('../validators/unikernel')
const stateRouter = require('./state')

const controller = require('../controllers/unikernel')

router.get('/',
  admin_auth,
  controller.dispatch)

router.post('/',
  admin_auth,
  unikernel_val.new,
  controller.dispatch)

router.get('/:unikernel_id', 
  admin_auth,
  unikernel_val.update,
  controller.dispatch)

router.delete('/:unikernel_id',
  admin_auth,
  unikernel_val.update,
  controller.dispatch)

router.post('/:unikernel_id/stop', 
  admin_auth,
  unikernel_val.update,
  controller.dispatch)

router.post('/:unikernel_id/suspend', 
  admin_auth,
  unikernel_val.update,
  controller.dispatch)

router.post('/:unikernel_id/resume', 
  admin_auth,
  unikernel_val.update,
  controller.dispatch)

router.post('/:unikernel_id/migrate', 
  admin_auth,
  unikernel_val.update,
  controller.dispatch)

router.post('/:unikernel_id/terminate',
  unikernel_auth,
  unikernel_val.update,
  controller.dispatch)

router.post('/:unikernel_id/ready',
  unikernel_auth,
  unikernel_val.update,
  controller.dispatch)

router.use("/:unikernel_id/states", unikernel_val.update, stateRouter)

module.exports = router
