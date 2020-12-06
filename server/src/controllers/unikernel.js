const service = require('../services/unikernel')
const errorHelper = require('../services/errors')
const ManagerError = errorHelper.ManagerError

module.exports.dispatch = async function (req, res) {
  try{
    let f = get_service(req.route, req.method)
    let result = await f(req.xen_host, req.unikernel)
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
        return service.get_all_unikernels
      else if (method === 'POST')
        return service.init_unikernel
    case '/:unikernel_id':
      if (method === 'GET')
        return service.get_unikernel
      else if (method === 'DELETE')
        return service.delete_unikernel
      break
    case '/:unikernel_id/stop':
      return service.stop_unikernel
    case '/:unikernel_id/suspend':
      return service.suspend_unikernel
    case '/:unikernel_id/resume':
      return service.resume_unikernel
    case '/:unikernel_id/migrate':
      return service.migrate_unikernel
    case '/:unikernel_id/ready':
      return service.ready
    case '/:unikernel_id/terminate':
      return service.terminate
    default:
      throw new ManagerError("Endpoint not defined",500)
  }
}