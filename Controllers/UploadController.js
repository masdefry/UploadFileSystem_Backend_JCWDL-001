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
            // req.files.forEach((value, index) => {
            //     if(value.size > 20000){
            //         throw { message: 'File Size Too Large!' }
            //     }
            // })

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

            let query2 = 'INSERT INTO product_images (path, products_id) VALUES ?'
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

            if(pathLocationToDelete){
                deleteFiles(pathLocationToDelete)
            }

            res.status(400).send({
                error: true, 
                message: error.message
            })
        }
    },

    updateImage: async(req, res) => {
        // 1. Upload Image (Pindahkan File Image -> Public)
        // 2. Update Image Path di Dalam Db
        // 3. Delete Image Lamanya
        try {
            let idImage = req.params.idImage 
            
            // 1. Upload Image
            const multipleUploadAwait = util.promisify(multipleUpload).bind(multipleUpload)
            await multipleUploadAwait(req, res)
           
            if(req.files.length === 0) throw { message: 'File Not Found!' }
            if(req.files.length > 1) throw { message: 'File Cant Be More Than 1!' }
            req.files.forEach((value, index) => {
                if(value.size > 20000){
                    throw { message: 'File Size Too Large!' }
                }
            })

            // 2. OldPathLocation from Db 
            let queryFindImage = 'SELECT * FROM product_images WHERE id = ?'
            const findImage = await query(queryFindImage, idImage)
            .catch((error) => {
                throw error 
            })
            const oldPathLocation = findImage[0].path


            // 2. Update Image Path yang ada didalam Db
            let newPathLocation = req.files[0].path

            let query1 = 'UPDATE product_images SET ? WHERE id = ?'
            const updateImage = await query(query1, [{path: newPathLocation}, idImage])
            .catch((error) => {
                throw error 
            })

            // 3. Delete Image Lamanya
            deleteFiles(oldPathLocation)

            await query('Commit')
            res.status(200).send({
                error: false, 
                message: 'Update Image Success!'
            })
        } catch (error) {
            res.status(400).send({
                error: true, 
                message: error.message
            })
        }
    },

    deleteProduct: async(req, res) => {
        // 1. Check Id Product
        // 2. Get OldPathLocation dari dalam product_images -> Untuk menghapus image lama dari storage
        // 3. Delete Image dari tabel product_images
        // 3. Delete Product dari tabel products
        // 4. Delete Files
        try {
            // Step-1
            let idProduct = req.params.idProduct
            const findProduct = await query('SELECT * FROM products WHERE id = ?', idProduct)
            .catch((error) => {
                throw error 
            })

            if(findProduct.length === 0){
                throw { message: 'Id Product Not Found!' }
            }

            let query1 = 'SELECT * FROM product_images WHERE products_id = ?'
            const findImage = await query(query1, idProduct)
            .catch((error) => {
                throw error 
            })

            let oldPathLocation = findImage.map((value) => {
                return value.path
            })

            // Step-3 
            let query2 = 'DELETE FROM product_images WHERE products_id = ?'
            const deleteImages = await query(query2, idProduct)
            .catch((error) => {
                throw error 
            })

            // Step-4 
            let query3 = 'DELETE FROM products WHERE id = ?'
            const deleteProduct = await query(query3, idProduct)
            .catch((error) => {
                throw error 
            })

            // Step-5
            deleteFiles(oldPathLocation)

            await query('Commit')
            res.status(200).send({
                error: false, 
                message: 'Delete Product Success!'
            })
        } catch (error) {
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