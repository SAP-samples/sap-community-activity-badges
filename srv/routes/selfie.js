const svg = require("../util/svgRender")
const texts = require("../util/texts")
const sharp = require('sharp')

module.exports = (app) => {
    // import multer and the AvatarStorage engine
    let _ = require('lodash')
    let path = require('path')
    let multer = require('multer')
    let limits = {
        files: 1, // allow only 1 file per request
        fileSize: 1024 * 1024 * 20, // 20 MB (max file size)
    }

    let fileFilter = async (req, file, cb) => {
        // supported image file mimetypes
        let allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/gif']

        if (_.includes(allowedMimes, file.mimetype)) {
            // allow supported image files
            cb(null, true)
        } else {
            // throw error for invalid files
            cb(new Error('Invalid file type. Only jpg, png and gif image files are allowed.'))
        }
    }

    // setup multer
    const storage = multer.memoryStorage()
    let upload = multer({
        storage: storage,
        limits: limits,
        fileFilter: fileFilter
    })

    const uploadHandler = upload.single('selfie')
    app.post('/upload_selfie', async (req, res, next) => {
        await uploadHandler(req, res, async (err) => {
            if (err instanceof multer.MulterError) {
                if(err.toString() == 'MulterError: File too large'){
                    return res.send('Uploaded file is too large. Please choose a file less than 20MB in size').status(500)
                }else{
                    return res.send(err.toString()).status(500)
                }
            } else if (err) {
                return res.send(err.toString()).status(500)
            }
            console.log(req.file)
            const uploadContent = await sharp(req.file.buffer).png().toBuffer()

            let body = 
              svg.svgHeader(1512, 2016) +
              svg.svgStyles(
                svg.svgStyleHeader(),
                svg.svgStyleBold()
            ) +
              svg.svgDevtoberfestItem(0, 0, 0, uploadContent.toString('base64'), 2016, 1512, true) +
              svg.svgDevtoberfestItem(0, 0, 0, await svg.loadImageB64('../images/devtoberfest/selfie/selfie1.png'), 2016, 1512, true) +
              svg.svgEnd()

              //return res.type("image/svg+xml").status(200).send(body)


              const png = await sharp(Buffer.from(body)).png().toBuffer()
              res.type("image/png").status(200).send(png)
           // res.contentType(req.file.mimetype)
           // res.send(req.file.buffer).status(200)
        })

    })
}