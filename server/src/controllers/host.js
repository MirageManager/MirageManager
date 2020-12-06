const service = require('../services/host')
const errorHelper = require('../services/errors')
const ManagerError = errorHelper.ManagerError

module.exports.dispatch = async function (req, res) {
  try{
    let f = get_service(req.route, req.method)
    let result
    if (req.xen_host) result = await f(req.xen_host)
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
      if (method === 'POST')
        return service.register_host
      else if (method === 'GET')
        return service.get_all
    case '/:host_id':
      if (method === 'GET')
        return service.get_host
      else if (method === 'DELETE')
        return service.deregister_host
      break
    default:
      throw new ManagerError("Endpoint not defined",500)
  }
}