import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadonCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null;
        // uploading file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        //file has been uploaded successfully
        console.log("File uploaded successfully on Cloudinary", response.url);
        fs.unlinkSync(localFilePath);
        return response;

    } catch(error){
        fs.unlinkSync(localFilePath);
        // removes locally saved file as upload operation got failed
        return null;
    }
}

export {uploadonCloudinary};