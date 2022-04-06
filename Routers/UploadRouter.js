const express = require('express')
const routers = express.Router()

// Import Controller
const UploadController = require('./../Controllers/UploadController')

routers.post('/newproduct', UploadController.uploadProduct)

module.exports = routers