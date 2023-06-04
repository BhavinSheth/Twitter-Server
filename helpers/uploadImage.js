const { cloudinary } = require('../helpers/cloudinary')

const uploadImage = async (image) => {
  const cloudinaryRes = await cloudinary.uploader.upload(image, {
    folder: 'twitter',
    access_mode: 'public',
  })
  return cloudinaryRes.url
}

module.exports = uploadImage
