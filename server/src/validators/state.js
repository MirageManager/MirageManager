const State = require('../models/state');
const errorHelper = require('../services/errors')
const ManagerError = errorHelper.ManagerError

module.exports.new = async function (req, res, next) {
  try {
    let state
    if (req.body.action) {
      state = new State({state: req.body.state, action: req.body.action})
    } else {
      state = new State({state: req.body.state})
    }
    state.validate()
    .then(() => {
      req.state = state
      next()
    })
    .catch(err => {
      throw err
    })
  } catch (err) {
    let error_formatted = errorHelper.handle(err).error
    res.status(error_formatted.code).send(error_formatted.msg)
  } 
}

module.exports.update = async function (req, res, next) {
  try {
    await req.unikernel.populate({
      path: 'states', 
      options: {
        sort: {
          'created_at': -1,
          limit: 1
        }
      }
    }).execPopulate()
    if (req.unikernel.states.length > 0) {
      req.state = req.unikernel.states[0]
    } else {
      throw new ManagerError('Could not find state for that unikernel', 404)
    }
    next()
  } catch (err) {
    let error_formatted = errorHelper.handle(err).error
    res.status(error_formatted.code).send(error_formatted.msg)
  } 
}