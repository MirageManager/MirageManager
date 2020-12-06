const Host = require('../models/host')
const errorHelper = require('../services/errors')

module.exports.new = async function (req, res, next) {
  try {
    let host = new Host({name: req.body.host_name, uri: req.body.uri})
    host.validate()
    .then(() => {
      req.xen_host = host
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
  try{
    let host = await Host.findById(req.params.host_id)
    if (!host) {
      throw new Error("Host does not exist",400)
    }
    req.xen_host = host
    next()
  } catch (err) {
    let error_formatted = errorHelper.handle(err).error
    res.status(error_formatted.code).send(error_formatted.msg)
  } 
}