const path = require('path')
process.env.root_path = path.resolve('../')
const grpc = require('grpc');
const homedir = require('os').homedir();
const shell = require('shelljs');
const protoLoader = require('@grpc/proto-loader');
const rpn = require('request-promise-native');
const jwt = require('jsonwebtoken');
const argv = require('yargs').count('verbose').alias('v', 'verbose').argv;
const logger = require('../../helpers/log_helper');

shell.config.silent = argv.verbose === 0

const packageDefinition = protoLoader.loadSync(
    `${process.env.root_path }/../protob/miragemanager.proto`,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    }
);

const host_runner_proto = grpc.loadPackageDefinition(packageDefinition).mirageManager;

class hostController {
  constructor(name, uri, port, mm_uri, user_name, password) {
    this.id
    this.name = name
    this.uri = uri
    this.port = port
    this.mm_uri = mm_uri
    this.user_name = user_name
    this.password = password
    this.server = new grpc.Server();
    this.server.addService(host_runner_proto.Host.service, {
      mm_uri: mm_uri,
      runUnikernel: this.run_unikernel,
      suspendUnikernel: this.suspend_unikernel,
      migrateUnikernel: this.migrate_unikernel,
      destroyUnikernel: this.destroy_unikernel,
      downloadImage: this.download_image,
      go: this.unikernel_go
    })
    this.server.bind(`${uri}:${port}`, grpc.ServerCredentials.createInsecure());
    this.server.start();
  }

  run_unikernel = function (call, callback) {
    let unikernel = call.request
    logger.info(`Running unikernel ${unikernel.name}`)
    logger.debug(JSON.stringify(unikernel, null, 4))
    let keys = `extra="`
    keys = keys.concat(`repo=http://${this.mm_uri}`)
    keys = keys.concat(` token=${unikernel.token}`)
    keys = keys.concat(` migration=${unikernel.migration}`)
    keys = keys.concat(` id=${unikernel.unikernel_id}`)
    keys = keys.concat(` hostid=${unikernel.host_id}`)
    let dir = homedir + '/unikernels/'
    if (!unikernel.dhcp===true) {
      dir += unikernel.image + '/static'
      keys = keys.concat(` ipv4=${unikernel.ip}`)
      keys = keys.concat(` ipv4-gateway=${unikernel.gateway}`)
      keys = keys.concat(` resolver=${unikernel.dns}`)
    } else {
      dir += unikernel.image + '/dhcp'
    }
    keys = keys.concat("\"")
    keys = keys.concat(`; name="${unikernel.name}"`)
    let xen_name = unikernel.image.replace("-","_")
    keys = keys.concat(`; kernel="${dir}/${xen_name}.xen"`)
    let xl_name = unikernel.image.replace('-','_')
    let cmd = `sudo xl create ${dir}/${xl_name}.xl '${keys}'`
    logger.info(`Run: ${cmd}`)
    let res = shell.exec(cmd)
    if (res.code !== 0) {
      let msg = "Could not run unikernel"
      logger.info(msg)
      return callback(new Error(msg), null)
    }  
    cmd = "sudo xl list -l"
    logger.info(`Run: ${cmd}`)
    res = shell.exec(cmd)
    if (res.code !== 0) callback(new Error("Could not retrieve domid"), null)
    let doms = JSON.parse(res.toString())
    let dom = doms.find(d => d.config.c_info.name === unikernel.name)
    if (!dom) callback(new Error("Could not retrieve domid"), null)
    let domid = dom.domid
    return callback(null, {domID: domid})
  }
  
  suspend_unikernel = function (call, callback) {
    let unikernel = call.request
    logger.info(`Suspending unikernel ${unikernel.name}`)
    logger.debug(JSON.stringify(unikernel, null, 4))
    let cmd = `sudo xenstore-write /local/domain/${unikernel.domID}/control/shutdown \"suspend\"`
    logger.info(`Run: ${cmd}`)
    let res = shell.exec(cmd)
    if (res.code !== 0) callback(new Error(`Could not suspend ${unikerne.name}`), null)
    else return callback(null, {})
  }

  migrate_unikernel = function (call, callback) {
    let unikernel = call.request
    logger.info(`Migrating unikernel ${unikernel.name}`)
    logger.debug(JSON.stringify(unikernel, null, 4))
    let cmd = `sudo xenstore-write /local/domain/${unikernel.domID}/control/shutdown \"migrate\"`
    logger.info(`Run: ${cmd}`)
    let res = shell.exec(cmd)
    if (res.code !== 0) callback(new Error(`Could not suspend ${unikerne.name}`), null)
    else return callback(null, {})
  }
  
  destroy_unikernel = function (call, callback) {
    let unikernel = call.request
    logger.info(`Destroying unikernel ${unikernel.name}`)
    logger.debug(JSON.stringify(unikernel, null, 4))
    let cmd = `sudo xl destroy ${unikernel.domID}`
    logger.info(`Run: ${cmd}`)
    let res = shell.exec(cmd)
    if (res.code !== 0) callback(new Error(`Could not destroy ${unikernel.name}`), null)
    else return callback(null, {})
  }
  
  download_image = function (call, callback) {
    let image = call.request
    logger.info(`Downloading image ${image.name}`)
    logger.debug(JSON.stringify(image, null, 4))
    let dir = homedir + '/unikernels/'
    let cmd = `rm -rf ${dir}${image.name}`
    logger.info(`Run: ${cmd}`)
    let res = shell.exec(cmd)
    if (res.code !== 0) callback(new Error(`Could not delete contents ${image.name}'s dir`), null)
    cmd = `mkdir -p ${dir}${image.name}`
    logger.info(`Run: ${cmd}`)
    res = shell.exec(cmd)
    if (res.code !== 0) callback(new Error(`Could not create dir for ${image.name}`), null)
    cmd = `git clone ${image.git} ${dir}${image.name}`
    logger.info(`Run: ${cmd}`)
    res = shell.exec(cmd)
    if (res.code !== 0) callback(new Error(`Could not clone ${image.name}`), null)
    else return callback(null, {})
  }
  
  unikernel_go = function (call, callback) {
    let unikernel = call.request
    logger.info(`Giving unikernel ${unikernel.name} go signal`)
    logger.debug(JSON.stringify(unikernel, null, 4))
    let cmd = `sudo xenstore-write /local/domain/${unikernel.domID}/data/migrate \"go\"`
    logger.info(`Run: ${cmd}`)
    let res = shell.exec(cmd)
    if (res.code !== 0) callback(new Error(`Could give go to ${unikerne.name}`), null)
    else return callback(null, {})
  }
  
  login = function () {
    logger.info('Logging in to MirageManager server')
    return rpn({
      method: 'POST',
      uri: `http://${this.mm_uri}/login`,
      resolveWithFullResponse: true,
      json: true,
      body: {
        name: this.user_name,
        password: this.password
      }
    })
    .then(res => {
       this.token = res.body.token
       return true
    })
    .catch(err => {
        logger.error(err.message)
        process.exit(1)
    })
  }

  auth = function () {
    logger.info('Checking auth')
    let dec = jwt.decode(this.token)
    let now = Math.floor(Date.now()/1000)
    if (dec.exp - now < 0) return this.login()
    logger.info('Auth valid')
    return Promise.resolve(true)
  }

  register = function () {
    logger.info('Registering host_runner')
    return this.auth()
    .then(res => {
      return rpn({
        method: 'POST',
        uri: `http://${this.mm_uri}/hosts`,
        resolveWithFullResponse: true,
        json: true,
        auth: {
          'bearer': this.token
        },
        body: {
          host_name: this.name,
          uri: `${this.uri}:${this.port}`
        }
      })
    })
    .then(res => {
      this.id = res.body.id
      logger.info('registered host controller')
    })
    .catch(err => {
        logger.error(err.message)
        process.exit(1)
    })
  }

  deregister = function () {
    logger.info('Deregistering host_runner')
    return this.auth()
    .then(res => {
      return rpn({
        method: 'DELETE',
        uri: `http://${this.mm_uri}/hosts/${this.id}`,
        auth: {
          'bearer': this.token
        },
        resolveWithFullResponse: true,
      })
    })
    .then(() => {
      logger.info('Deregistered host controller')
    })
    .catch(err => {
        logger.error(err.message)
        process.exit(1)
    })
  }
}

let required_args = ['name', 'uri', 'port', 'mm_uri', 'user_name', 'password']
let missing= []
for (rarg of required_args) {
  if (!argv.hasOwnProperty(rarg)) {
    missing.push(rarg)
  } 
} 
if (missing.length > 0) {
  logger.error(`Required arguments ${missing.join(', ')} are mssing.`)
  process.exit(1)
}

const controller = new hostController(argv.name, argv.uri, argv.port, argv.mm_uri, argv.user_name, argv.password)

process.on('SIGINT', () => {
  controller.deregister()
  .then(res => {
    process.exit(0)
  })
  .catch(err => {
    logger.info('Could not derigister')
    process.exit(1)
  })
})

controller.login()
.then(() => {
  return controller.register()
})
.then(res => {
  logger.info('Running and waiting for RPCs')
})
.catch(err => {
  logger.error('Could not setup connection')
  logger.debug(err)
  process.exit(1)
})







