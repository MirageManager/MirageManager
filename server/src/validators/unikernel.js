const Unikernel = require('../models/unikernel');
const errorHelper = require('../services/errors')
const ManagerError = errorHelper.ManagerError

module.exports.new = async function (req, res, next) {
  try {
    let unikernel = new Unikernel(
      {
        name: req.body.name,
        image: req.body.image,
        network_info: req.body.network_info
      }
    )
    unikernel.validate()
    .then(() => {
      req.unikernel = unikernel
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
    let unikernel = await Unikernel.findById(req.params.unikernel_id)
    if (!unikernel) {
      throw new ManagerError("Could not find unikernel", 404)
    }
    if (!req.xen_host.unikernels.find(id => id.equals(unikernel._id))) {
      throw new ManagerError("Mismatch", 400)
    }
    if (req.path.endsWith('/migrate') || req.path.endsWith('/resume')) {
      unikernel.network_info = req.body.network_info
      unikernel.migration.new_host = req.body.host
      unikernel.validate()
      .then(res => {
        req.unikernel = unikernel
        next()
      })
      .catch(err => {
        throw err
      })
    } else {
      req.unikernel = unikernel
      next()
    }
  } catch (err) {
    let error_formatted = errorHelper.handle(err).error
    res.status(error_formatted.code).send(error_formatted.msg)
  } 
}