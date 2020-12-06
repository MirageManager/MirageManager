const ManagerError = require('./errors').ManagerError
const Image = require('../models/image')
const CFG = require('../../../helpers/cfg_helper').CFG
const fs = require('fs')
const path = require('path')
const RPC = require('../services/rpcs')

module.exports.get_all = async function () {
  try {
    let main_images = JSON.parse(fs.readFileSync(path.resolve(CFG.mirage_manager.image_repo_path)))
    return main_images
  } catch (err) {
    throw new ManagerError("Could not access image-repository", 500)
  }
}

module.exports.init_image_on_host = async function (host, image_name) {
  let img
  host = await host.populate({
    path: 'images',
    match: {name: image_name}
  }).execPopulate()

  if (host.images.length === 0) {
    let main_images
    try {
      main_images = await module.exports.get_all()
    } catch (err) {
      throw new ManagerError("Could not access image-repository", 500)
    }
    image = main_images.find(img => img.name === image_name)
    if (!image) throw new ManagerError("Image does not exist", 500)
    img = new Image({
      name: image.name,
      git: image.git,
      downloaded: false,
      built: false
    })
    await img.save()
    host.images.push(img._id)
    await host.save()
  } else {
    img = host.images[0]
  }
  if (!img.downloaded === true) {
    await RPC.download_image(host.name, img)
    img.downloaded = true
    await img.save()
  }
  return img
}