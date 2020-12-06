const service = require('../services/login')
const errorHelper = require('../services/errors')

module.exports.dispatch = async function (req, res) {
  try{
    let result = service.login(req.body)
    res.status(200).json(result)
  } catch (err) {
    let error_formatted = errorHelper.handle(err).error
    res.status(error_formatted.code).send(error_formatted.msg)
  }
}