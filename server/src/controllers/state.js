const service = require('../services/state')
const errorHelper = require('../services/errors')
const ManagerError = errorHelper.ManagerError

module.exports.dispatch = async function (req, res) {
  try{
    let f = get_service(req.route, req.method)
    let result = await f(req.xen_host, req.unikernel, req.state)
    res.status(200).json(result)
  } catch (err) {
    let error_formatted = errorHelper.handle(err).error
    res.status(error_formatted.code).send(error_formatted.msg)
  }
}

let get_service = (route, method) => {
  switch (route.path) {
    case '/':
      return service.save_state
    case '/latest':
      return service.retrieve_latest_state
    default:
      throw new ManagerError("Endpoint not defined",500)
  }
}