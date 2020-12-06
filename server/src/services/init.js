const shell = require('shelljs')
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')

const Host = require('../models/host');
const RPC = require('../services/rpcs')
const CFG = require('../../../helpers/cfg_helper').CFG
const logger = require('../../../helpers/log_helper')


module.exports.check_git = function () {
  if (!shell.which('git')) {
    throw new Error("Git must be installed to run MirageManager")
  }
}

module.exports.connect_mongoose = async function () {
  logger.info('Connecting to MongoDB')
  await mongoose.connect(CFG.database.mongo_uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
}

module.exports.init_repo = function () {
  let file_path = CFG.mirage_manager.image_repo_path
  let dir = path.dirname(CFG.mirage_manager.image_repo_path)
  let git = CFG.mirage_manager.image_repo_git
  if (fs.existsSync(file_path)) {
      logger.info('Unikernel-repo is already available')
      return false
  } 
  logger.info('Initializing unikernel-repo')
  let res = shell.exec(`mkdir -p ${dir}`)
  if (res.code!==0) throw new Error("Could not create repo directory")
  res = shell.exec(`git clone ${git} ${dir}`)
  if (res.code!==0) throw new Error("Could not retrieve repo-files")
  logger.info(`Successfully cloned unikernel-repository file from ${git}`)
  return true
}

module.exports.update_repo = function () {
  let dir = path.dirname(CFG.mirage_manager.image_repo_path)
  let res = shell.exec(`git -C ${dir} pull`)
  if (res.code!==0) throw new Error("Could not update repo-files")
}

module.exports.init_host_connections = async function () {
  logger.info('Initializing host connections')
  let hosts = await Host.find({})
  for (host of hosts) {
    RPC.addHostController(host.name, host.uri)
  }
}