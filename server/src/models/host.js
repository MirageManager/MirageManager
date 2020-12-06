const mongoose = require('mongoose')

const hostSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    uri: {
        type: String,
        required: true,
    },
    images: [{
        type: mongoose.ObjectId, 
        ref: 'Image'
    }],
    unikernels: [{
        type: mongoose.ObjectId, 
        ref: 'Unikernel'
    }]
})

const Host = mongoose.model('Host', hostSchema)
module.exports = Host