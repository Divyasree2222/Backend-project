// file upload

import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });

export const uploadOnCloudinary = async (localFilePath) => {
  try{
    if(!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, { resource_type: 'auto'});
    //console.log("File is uploaded on cloudinary", response.url)
    fs.unlinkSync(localFilePath)
    return response;
  } catch(error){
    fs.unlinkSync(localFilePath)  // if the file upload is failed, remove the file from local server
    //sync * async
    console.error("Cloudinary upload failed:", error);
    throw error; 
  }
}

export const deleteFromCloudinary = async (fullUrl, resourceType = "image") => {
    try {
        if (!fullUrl) return null;

        const parts = fullUrl.split('/upload/');
        if (parts.length < 2) throw new Error("Invalid Cloudinary URL format");
        
        let publicIdWithExtension = parts[1];

        if (publicIdWithExtension.startsWith('v')) {
            publicIdWithExtension = publicIdWithExtension.split('/').slice(1).join('/');
        }

        const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        return result;
    } catch (error) {
        console.error("Cloudinary deletion failed:", error);
        return null;
    }
};