const express = require('express')
const app = express()
app.use(express.json())

const cors = require('cors')
app.use(cors())

app.get('/', (req, res) => {
    res.status(200).send('Upload File System API')
})

app.use('/Public', express.static('Public')) // Memberikan akses ke client untuk mengambil assets image kita

// Import Routers
const UploadRouter = require('./Routers/UploadRouter')
app.use('/upload', UploadRouter)

const port = 5000
app.listen(port, () => console.log(`API Running on Port ${port}`))