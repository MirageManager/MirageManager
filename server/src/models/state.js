const mongoose = require('mongoose')

const stateSchema = mongoose.Schema({
    state: {
        type: Object,
        required: true
    },
    action: {
        type: String,
        required: false,
        enum: [
            'suspend',
            'migrate'
        ]
    }
    
})

const State = mongoose.model('State', stateSchema)
module.exports = State