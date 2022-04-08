const express = require('express')
const routers = express.Router()

// Import Controller
const UploadController = require('./../Controllers/UploadController')

routers.post('/newproduct', UploadController.uploadProduct)
routers.patch('/updateimage/:idImage', UploadController.updateImage)
routers.delete('/deleteproduct/:idProduct', UploadController.deleteProduct)
routers.get('/getproduct', UploadController.getProducts)

module.exports = routers