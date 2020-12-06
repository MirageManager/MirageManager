const Host = require('../models/host')
const RPC = require('../services/rpcs')
const ManagerError = require('./errors').ManagerError

module.exports.register_host = async function (host) {
  await host.save()
  RPC.addHostController(host.name, host.uri)
  return format_res(host)
}

module.exports.deregister_host = async function (host) {
  RPC.removeHostController(host.name) 
  await Host.findByIdAndRemove(host._id)
  return format_res(host)
}

module.exports.get_host = function (host) {
  return format_res(host)
}

module.exports.find_host_by_name = async function(host_name) {
  let host = await Host.findOne({name: host_name})
  return host
}

module.exports.find_host_by_id = async function(id) {
  let host = await Host.findById(id)
  return host
}

module.exports.get_all = async function () {
  let hosts = await Host.find({})
  if (!hosts) throw new ManagerError('No hosts found', 404)
  let res = hosts.map(h => format_res(h))
  return res
}

let format_res = function(host, unikernel) {
  let formatted = {
    id: host._id,
    host: host.name,
  }
  return formatted
}