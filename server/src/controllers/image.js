const service = require('../services/image')
const errorHelper = require('../services/errors')
const ManagerError = errorHelper.ManagerError

module.exports.dispatch = async function (req, res) {
  try{
    let f = get_service(req.route, req.method)
    let result
    if (req.xen_host) result = await f()
    else result = await f()
    res.status(200).json(result)
  } catch (err) {
    let error_formatted = errorHelper.handle(err).error
    res.status(error_formatted.code).send(error_formatted.msg)
  }
}

let get_service = (route, method) => {
  switch (route.path) {
    case '/':
      if (method === 'GET')
        return service.get_all
      else 
        throw new ManagerError("Endpoint not defined",500)
    default:
      throw new ManagerError("Endpoint not defined",500)
  }
}