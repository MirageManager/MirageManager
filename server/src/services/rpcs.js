const grpc = require('grpc');
const CFG = require('../../../helpers/cfg_helper').CFG
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync(
    `${process.env.root_path}/../protob/miragemanager.proto`,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
const host_runner_proto = grpc.loadPackageDefinition(packageDefinition).mirageManager;

const errorHelper = require('./errors')
const ManagerError = errorHelper.ManagerError
const logger = require('../../../helpers/log_helper')

const host_runners = {}

module.exports.addHostController = function (host_name, uri) {
    host_runners[host_name] = new host_runner_proto.Host(uri,
        grpc.credentials.createInsecure());
}

module.exports.removeHostController = function (host_name) {
    delete host_runners[host_name]
}

module.exports.run_unikernel = function (host_name, unikernel, migration, host_id) {
    return new Promise((resolve, reject) => {
        logger.info(`Running unikernel ${unikernel.name} on ${host_name}`)
        let client = host_runners[host_name]
        if (!client) throw new ManagerError('Host is not connected', 400)
        let msg = {
            name: migration ? unikernel.migration.new_name : unikernel.name,
            image: unikernel.image,
            unikernel_id: unikernel._id,
            host_id: host_id,
            repo:  CFG.webserver.base_url,
            migration: migration,
            token: unikernel.tokens[0].token, 
            dhcp:unikernel.dhcp
        }
        if (unikernel.network_info.dhcp===false) {
            msg.ip = unikernel.network_info.ip
            msg.gateway = unikernel.network_info.gateway
            msg.dns = unikernel.network_info.dns
        } else {
            msg.dhcp = true
        }
        client.runUnikernel(msg, function(err, response) {
            if (err) {
                reject(new ManagerError('Could not run unikernel',500))
            } else resolve(response.domID)
        })
    })
}

module.exports.suspend_unikernel = function (host_name, unikernel) {
    return new Promise((resolve, reject) => {
        logger.info(`Suspending unikernel ${unikernel.name} on ${host_name}`)
        let client = host_runners[host_name]
        if (!client) throw new ManagerError('Host is not connected', 400)
        let msg = {
            name: unikernel.name,
            domID: unikernel.domID
        }
    
        client.suspendUnikernel(msg, function(err, response) {
            if (err) {
                reject(new ManagerError('Could not suspend unikernel',500))
            } resolve(response)
        }) 
    })
}

module.exports.migrate_unikernel = function (host_name, unikernel) {
    return new Promise((resolve, reject) => {
        logger.info(`Migrating unikernel ${unikernel.name} on ${host_name}`)
        let client = host_runners[host_name]
        if (!client) throw new ManagerError('Host is not connected', 400)
        let msg = {
            name: unikernel.name,
            domID: unikernel.domID
        }
        client.migrateUnikernel(msg, function(err, response) {
            if (err) {
                reject(new ManagerError('Could not suspend unikernel',500))
            } resolve(response)
        }) 
    })
}

module.exports.destroy_unikernel = function (host_name, unikernel, migration) {
    return new Promise((resolve, reject) => {
        logger.info(`Destroying unikernel ${unikernel.name} on ${host_name}`)
        let client = host_runners[host_name]
        if (!client) throw new ManagerError('Host is not connected', 400)
        let msg = {
            name: unikernel.name,
            domID: unikernel.domID
        }
    
        client.destroyUnikernel(msg, function(err, response) {
            if (err) {
                reject(new ManagerError('Could not destroy unikernel',500))
            } resolve(response)
        })
    })
}

module.exports.download_image = function (host_name, image) {
    return new Promise((resolve, reject) => {
        logger.info(`Downloading image ${image.name} on ${host_name}`)
        let client = host_runners[host_name]
        if (!client) throw new ManagerError('Host is not connected', 400)
        let msg = {
            name: image.name,
            git: image.git
        }
    
        client.downloadImage(msg, function(err, response) {
            if (err) {
                reject(new ManagerError('Could not download image',500))
            } resolve(response)
        })
    })
}

module.exports.unikernel_go = async function (host_name, unikernel, migration) {
    return new Promise((resolve, reject) => {
        logger.info(`Giving unikernel ${unikernel.name} go signal`)
        let client = host_runners[host_name]
        if (!client) throw new ManagerError('Host is not connected', 400)
        let msg = {
            name: migration ? unikernel.migration.new_name : unikernel.name,
            domID: migration ? unikernel.migration.new_domID : unikernel.domID
        }

        client.go(msg, function(err, response) {
            if (err) {
                reject(new ManagerError('Could not send go signal',500))
            } resolve(response)
        }) 
    })
}