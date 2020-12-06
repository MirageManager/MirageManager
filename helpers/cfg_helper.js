require('dotenv').config({ path: `${process.env.root_path}/cfg/env` })
const YAML = require('yaml')
const fs = require('fs')
let file
try {
    file = fs.readFileSync(`${process.env.root_path}/cfg/config.yml`, 'utf8')
} catch (err) {
    console.log('Could not load config file')
    process.exit(1)
}

let raw_config = YAML.parse(file)

let fill_tokens_rec = function (config_obj) {
    let name_regex = /\$\{(.*)\}/ 
    let opt_regex = /^opt /
    for (key in config_obj) {
        let val = config_obj[key]
        if (typeof val === 'object')
            config_obj[key] = fill_tokens_rec(val)
        else if (typeof val === 'string') {
            let m = val.match(name_regex)
            let r = !val.match(opt_regex)
            if (m) {
                let var_name = m[1]
                let var_val = process.env[var_name]
                if (r && !var_val) {
                    console.log(`Env-Variable ${var_name} is not defined. Terminating`)
                    process.exit(1)
                } else {
                    config_obj[key] = var_val
                }
            }
        }
    }
    return config_obj
}

let filled_in = fill_tokens_rec(raw_config)

module.exports.CFG = filled_in