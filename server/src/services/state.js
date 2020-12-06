const ManagerError = require('../services/errors').ManagerError
const unikernel_services = require('../services/unikernel')
const CFG = require('../../../helpers/cfg_helper').CFG
const RPC = require('./rpcs')

module.exports.save_state = async function (host, unikernel, state) {
  await state.save()
  unikernel.states.push(state._id)
  await unikernel.save()
  if (state.action === 'suspend') {
    unikernel.status = 'suspend_confirmed'
    unikernel.tokens = []
    await unikernel.save()
  } else if (state.action === 'migrate') {
    if (!CFG.mirage_manager.migration.boost)
      await RPC.unikernel_go(unikernel.migration.new_host, unikernel, true)
    unikernel_services.complete_migration(host, unikernel)
  }
  return format_res(state)
}

module.exports.retrieve_latest_state = async function (host, unikernel, state) {
  if (unikernel.status === 'started' || unikernel.status === 'migration_ready') {
    unikernel.status = 'connected'
    await unikernel.save()
  }
  if (!state) {
    throw new ManagerError('No state available for this unikernel')
  }
  return format_res(state)
}

let format_res = function(state) {
  return {
    id: state._id,
    state: state.state
  }
}