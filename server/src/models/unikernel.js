const mongoose = require('mongoose')

const unikernelSchema = mongoose.Schema({
    status: {
        type: String,
        enum: [
            'created',
            'started',
            'connected',
            'suspend_pending', 
            'suspend_confirmed', 
            'suspend_failed',
            'migration_pending',
            'migration_ready',
            'migration_failed',
            'terminated',
            'stopped'
        ],
        default: 'created'
    },
    domID: {
        type: Number,
        default: null
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    network_info: {
        dhcp: {
            type: Boolean,
            required: true
        },
        ip: {
            type: String,
            required: function() {
                return this.network_info.dhcp == false;
              }
        },
        gateway: {
            type: String,
            required: function() {
                return this.network_info.dhcp == false;
              }
        },
        dns: {
            type: String,
            required: function() {
                return this.network_info.dhcp == false;
            }

        }
    },
    states: [{
        type: mongoose.ObjectId, 
        ref: 'State'
    }],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    migration: {
        new_name: {
            type: String,
        },
        new_host: {
            type: String,
        },
        new_domID: {
            type: Number,
        }
    }
})

const Unikernel = mongoose.model('Unikernel', unikernelSchema)

module.exports = Unikernel