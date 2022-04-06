const util = require('util')
const db = require('./../Connection/Connection')
const query = util.promisify(db.query).bind(db)

// Import MultipleUpload
const multipleUpload = require('./../Helpers/MultipleUpload.js')()

module.exports = {
    uploadProduct: async(req, res) => {
        try {
            await query('Start Transaction')

            const multipleUploadAwait = util.promisify(multipleUpload).bind(multipleUpload)
            await multipleUploadAwait(req, res)

            console.log(req.files)
        } catch (error) {
            
        }
    }
}

// Rollback Transaction :
//  - Begin Transaction
//  - Query Commit