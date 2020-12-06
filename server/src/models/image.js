const mongoose = require('mongoose')

const imageSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    }, 
    git: {
        type: String,
        required: true
    },
    downloaded: {
        type: Boolean,
        default: false
    }
})

const Image = mongoose.model('Image', imageSchema)
module.exports = Image