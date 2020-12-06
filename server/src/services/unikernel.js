const shell = require('shelljs')
const jwt = require('jsonwebtoken')

const Unikernel = require('../models/unikernel')
const CFG = require('../../../helpers/cfg_helper').CFG
const logger = require('../../../helpers/log_helper')
const RPC = require('../services/rpcs')
const migrations = require('../middleware/migrations').migrations
const image_services = require('./image')
const host_services = require('./host')
const errorHelper = require('./errors')
const ManagerError = errorHelper.ManagerError

shell.config.silent = !(['debug', 'silly', 'verbose'].includes(CFG.logging.log_level))

module.exports.init_unikernel = async function (host, unikernel) {
  await image_services.init_image_on_host(host, unikernel.image)
  unikernel = await start_unikernel(host, unikernel)
  return format_res(host, unikernel)
}

module.exports.get_all_unikernels = async function(host) {
  host = await host.populate('unikernels').execPopulate()
  return host.unikernels.map(u => format_res(host, u))
}

module.exports.get_unikernel = async function (host, unikernel) {
  return format_res(host, unikernel)
}

module.exports.delete_unikernel = async function (host, unikernel) {
  host.unikernels.pull(unikernel._id)
  await host.save()
  await Unikernel.findByIdAndDelete(unikernel._id)
  return format_res(host, unikernel)
}

module.exports.stop_unikernel = async function (host, unikernel) {
  await RPC.destroy_unikernel(host.name, unikernel)
  unikernel.status = 'stopped'
  unikernel.tokens = []
  await unikernel.save()
  return format_res(host, unikernel)
}

module.exports.suspend_unikernel = async function (host, unikernel) {
  if (unikernel.status != 'connected') {
    throw new ManagerError(`Unikernel is not connected and therefore can't be suspended.
    You can try again later or use POST unikernel/:id/stop to terminate it.
    Or DEL /unikernel if it is already terminated`,500)
  }
  unikernel.status = 'suspend_pending'
  await unikernel.save()
  try {
    await RPC.suspend_unikernel(host.name, unikernel)
  } catch (err) {
    unikernel.status = 'suspend_failed'
    await unikernel.save()
    throw new ManagerError("Could suspend unikernel",500)
  }
  return format_res(host, unikernel)
}

module.exports.resume_unikernel = async function (host, unikernel) {
  if (unikernel.status != 'suspend_confirmed') {
    throw new ManagerError("Unikernel is not suspended and therfore cant be resumed", 500)
  }
  let new_host_name = unikernel.migration.new_host
  let new_host 
  if (new_host_name !== host.name) {
    host.unikernels.pull(unikernel._id)
    await host.save()
    new_host = await host_services.find_host_by_name(new_host_name)
    if (!new_host) throw new ManagerError('Target host does not exist', 400)
  } else {
    new_host = host
  }
  await image_services.init_image_on_host(new_host, unikernel.image)
  let resumed_kernel = await start_unikernel(new_host, unikernel)
  resumed_kernel.status = 'started'
  await resumed_kernel.save()
  return format_res(host, unikernel)
}

module.exports.migrate_unikernel = async function (host, unikernel) {
  if (!(unikernel.status === 'connected' || unikernel.status === 'migration_failed')) {
    throw new ManagerError(`Unikernel is not connected and therefore can't be migrated.
    You can try again later or use POST unikernel/:id/stop to terminate it.
    Or DEL /unikernel if it is already terminated`,500)
  }
  let same_host = host.name === unikernel.migration.new_host
  let new_host 
  if (same_host) {
    new_host = host
    unikernel.migration.new_name = unikernel.name + '_migrated'
  } else {
    new_host = await host_services.find_host_by_name(unikernel.migration.new_host)
    unikernel.migration.new_name = unikernel.name
  }
  if (!new_host) throw new ManagerError('Target host does not exist', 400)
  unikernel.status = 'migration_pending'
  await unikernel.save()
  await image_services.init_image_on_host(new_host, unikernel.image)
  if (!same_host) {
    new_host.unikernels.push(unikernel._id)
    await new_host.save()
  }
  let domid = await RPC.run_unikernel(new_host.name, unikernel, true, new_host._id)
  unikernel = await Unikernel.findById(unikernel._id)
  unikernel.migration.new_domID = domid
  await unikernel.save()
  if (CFG.mirage_manager.migration.boost) {
    migrations[unikernel._id] = {
      unikernel: unikernel
    }
  }
  let i = 0
  let ready
  while (i < CFG.mirage_manager.migration.retries) {
    ready = await migration_conditioned_suspend(unikernel._id, host.name)
    if (ready) break
    i +=1 
  }
  unikernel = await Unikernel.findById(unikernel._id)
  if (ready === true) {
    return format_res(host, unikernel)
  }
  else {
    unikernel.status = 'migration_failed'
    await unikernel.save()
    await RPC.destroy_unikernel(new_host.name,{name: new_host.name, domID: domid})
    throw new ManagerError("New unikernel didn't start up. Migration failed", 500)
  }
}

module.exports.terminate = async function (host, unikernel) {
  unikernel.status = 'terminated'
  unikernel.tokens = []
  await unikernel.save()
  return format_res(host, unikernel)
}

module.exports.ready = async function (host, unikernel) {
  unikernel.status = 'migration_ready'
  unikernel.save()
  return format_res(host, unikernel)
}

let start_unikernel = async function (host, unikernel) {
  await generateAuthToken(unikernel)
  let domid = await RPC.run_unikernel(host.name, unikernel, false, host._id)
  unikernel.domID = domid
  unikernel.status = 'started'
  await unikernel.save()
  host.unikernels.push(unikernel._id)
  await host.save()
  await RPC.unikernel_go(host.name, unikernel, false)
  return unikernel
}

let timeout = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let migration_conditioned_suspend = async function (unikernel_id, host_name) {
  let curr = await Unikernel.findById(unikernel_id)
  if (curr.status !== 'migration_ready') {
    return timeout(CFG.mirage_manager.migration.timeout_ms)
    .then(() => {
      return false
    })
  } else {
    try {
      await RPC.migrate_unikernel(host_name, curr)
      return true
    } catch (err) {
      return false
    }
  }
}

module.exports.complete_migration = async function (old_host, unikernel) {
    let new_host
    try {
      new_host = await host_services.find_host_by_name(unikernel.migration.new_host)
      if (!new_host) throw new ManagerError('Target host does not exist', 400)
      let same_host = old_host.name === new_host.name
      await migration_host_update(unikernel, old_host, same_host)
    } catch (err) {
      errorHelper.handle(err)
      unikernel.status = 'migration_failed'
      await unikernel.save()
    }
}

let migration_host_update = async function (unikernel, old_host, same_host) {
  logger.info("Changing unikernels host")
  unikernel.domID = unikernel.migration.new_domID
  unikernel.name = unikernel.migration.new_name
  unikernel.status = 'connected'
  await unikernel.save()
  if (!same_host) {
    old_host.unikernels.pull(unikernel._id)
    await old_host.save()
  }
}

let generateAuthToken = async function(unikernel) {
    const token = jwt.sign({_id: unikernel._id}, CFG.authentication.jwt_key)
    unikernel.tokens = unikernel.tokens.concat({token})
    await unikernel.save()
    return token
}

let format_res = function(host, unikernel) {
  let formatted = {
    id: unikernel._id,
    name: unikernel.name,
    image: unikernel.image,
    host: host.name,
    domID: unikernel.domID,
    status: unikernel.status
  }
  if (unikernel.status.startsWith('migration_'))
    formatted.migration_info = unikernel.migration
  return formatted
}