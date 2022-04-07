const util = require('util')
const db = require('./../Connection/Connection')
const query = util.promisify(db.query).bind(db)

// Import MultipleUpload
const multipleUpload = require('./../Helpers/MultipleUpload.js')()
// Import Delete Files
const deleteFiles = require('../Helpers/DeleteFiles')
module.exports = {
    uploadProduct: async(req, res) => {
        try {
            await query('Start Transaction')

            const multipleUploadAwait = util.promisify(multipleUpload).bind(multipleUpload)
            await multipleUploadAwait(req, res)

            if(req.files.length === 0) throw { message: 'File Not Found!' }
            req.files.forEach((value, index) => {
                if(value.size > 20000){
                    throw { message: 'File Size Too Large!' }
                }
            })

            let data = req.body.data // Masih dalam bentuk text
            let dataParsed 
            try {
                dataParsed = JSON.parse(data)
            } catch (error) {
                res.status(500).send({
                    error: true,
                    message: 'Error Parsing Data!'
                })
            }

            let query1 = 'INSERT INTO products SET ?'
            const insertToProducts = await query(query1, dataParsed)
            .catch((error) => {
                throw error
            })

            const products_id = insertToProducts.insertId
           
            // Looping to Get Path from Each Image -> Delete Files -> [path1, path2, path3, ...]
            var pathLocationToDelete = req.files.map((value, index) => {
                return value.path
            })

            // Looping to Get Path from Each Image -> Insert to Db
            let pathLocation = req.files.map((value, index) => {
                return [ value.path, products_id ]
            })

            let query2 = 'INSERT INTOOO product_images (path, products_id) VALUES ?'
            const insertToProductsImages = await query(query2, [pathLocation])
            .catch((error) => {
                throw error 
            })
            
            await query('Commit')
            res.status(200).send({
                error: false, 
                message: 'Upload Product Success!'
            })
        } catch (error) {
            console.log(error)

            deleteFiles(pathLocationToDelete)

            res.status(400).send({
                error: true, 
                message: error.message
            })
        }
    }
}

// Rollback Transaction :
//  - Begin Transaction
//  - Query Commit