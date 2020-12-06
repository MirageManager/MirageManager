const Unikernel = require('../models/unikernel')
const logger = require('../../../helpers/log_helper')
const RPC = require('../services/rpcs')

module.exports.mw = async(req, res, next) => {
    if (req.method === 'POST' && req.path === '/') {
        if (req.body.action !== 'migrate') next()
        else {
            try {
                migrations[req.params.unikernel_id].state = req.body.state
                let unikernel = migrations[req.params.unikernel_id].unikernel
                await RPC.unikernel_go(unikernel.migration.new_host, unikernel, true)
                next()
            } catch (err) {
                let unikernel = await Unikernel.findById(req.body.id)
                logger.info("Couldn't send go signal to new unikernel")
                unikernel.status = 'migration_failed'
                await unikernel.save()
                res.status(500).send()
            }
        }
    } else if (req.method === 'GET' && req.path === '/latest') {
        if (!migrations[req.params.unikernel_id]) next()
        else {
            let state = migrations[req.params.unikernel_id].state
            delete migrations[req.params.unikernel_id]
            res.status(200).send({state: state})
        }
    } else {
        next()
    }
}

let migrations = {}

module.exports.migrations = migrations
