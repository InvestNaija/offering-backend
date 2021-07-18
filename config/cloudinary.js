const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'intelligent-innovations',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadImage = (image) => {
    try {
        const response = cloudinary.uploader.upload(image, 
            { eager: [
            { width: 400, height: 300, crop: "pad" }, 
            { width: 260, height: 200, crop: "crop", gravity: "north"} 
            ]},
             async(error, result) => {
            if(error) console.log('Error uploading image', error);
            else console.log(result.secure_url);
        })
        return response;
    } catch (error) {
        console.log('Error updating image ', error);
        return error;
    }
}

exports.uploadPdf = (pdfFile) => {
    try {
        const response = cloudinary.uploader.upload(pdfFile,
            async (error, result) => {
                if (error) console.log('Error uploading pdf file: ', error);
                else console.log(result.secure_url);
            })

        return response;
    } catch (error) {
        console.error('Error updating pdf file: ', error);
        return error;
    }
}