import mongoose from "mongoose"
import { asyncHandler } from "../utility/asyncHandler.js";
import { ApiError } from "../utility/ApiError.js";
import {Video} from "../models/video.model.js";
import { ApiResponse } from "../utility/ApiResponse.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utility/cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    
    // if(!query || !sortBy || !sortType || !userId){
    //   throw new ApiError(400, "required fields are missing")
    // }

    const order = (sortType === "asc") ? 1 : -1;

    const matchConditions = {
      isPublished: true
    };

    if (query) {
      matchConditions.title = {
        $regex: query,
        $options: "i"
      }
      matchConditions.description = {
        $regex: query,
        $options: "i"
      }
    }

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid userId");
    }

    if (userId) {
      matchConditions.owner = new mongoose.Types.ObjectId(userId);
    }

    const aggregate = Video.aggregate([
      {
        $match: matchConditions
      },
      {
        $sort: {
          [sortBy] : order
        }
      }
    ])

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };

    const videos = await Video.aggregatePaginate(aggregate, options);

    return res.
    status(200)
    .json(new ApiResponse(
      200, videos, "videos fetched successfully"
    ))
})

export const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // 1. Validate text fields
    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required");
    }

    // 2. Check user authentication
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "User is not logged in");
    }

    // 3. Get files from multer
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    let uploadedVideo;
    let uploadedThumbnail;

    try {
        // 4. Upload to Cloudinary
        uploadedVideo = await uploadOnCloudinary(videoLocalPath);
        uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!uploadedVideo) {
            throw new ApiError(500, "Video upload failed");
        }

        if (!uploadedThumbnail) {
            throw new ApiError(500, "Thumbnail upload failed");
        }

        // 5. Save to DB
        const video = await Video.create({
            title: title.trim(),
            description: description.trim(),
            videoFile: uploadedVideo.secure_url,
            thumbnail: uploadedThumbnail.secure_url,
            duration: uploadedVideo.duration || 0,
            views: 0, // optional (already defaulted in schema)
            isPublished: true,
            owner: userId
        });

        // 6. Return response
        return res.status(201).json(
            new ApiResponse(201, video, "Video published successfully")
        );

    } catch (error) {

        // 7. Rollback Cloudinary uploads if DB fails or anything breaks
        if (uploadedVideo?.public_id) {
            await deleteFromCloudinary(uploadedVideo.url, "video");
        }

        if (uploadedThumbnail?.public_id) {
            await deleteFromCloudinary(uploadedThumbnail.url, "image");
        }

        throw new ApiError(500, error?.message || "Failed to publish video");
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId) throw new ApiError(400, "video id is required")
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video id");
    }
    
    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(404, "video not found")

    return res.status(200).json(
      new ApiResponse(200, video, "video fetched successfuly")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;

    if(!mongoose.Types.ObjectId.isValid(videoId)){
      throw new ApiError(400, "videoid is not valid")
    }

    const thumbnailLocalPath = req.files?.thumbnail?.[0].path
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!title && !description && !thumbnailLocalPath){
      throw new ApiError(400, "atleast one field is required to update")
    }

    const updates = {}
    if(title){
      updates.title = title
    }
    if(description){
      updates.description = description
    }
    if(thumbnailLocalPath){
      updates.thumbnail = thumbnail
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, 
      {
        $set: updates
      },
      {
        new: true
      }
    )

    return res.status(200).json(
      new ApiResponse(200, updatedVideo, "video updated successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!mongoose.Types.ObjectId.isValid(videoId)){
      throw new ApiError(400, "invalid video ID");
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.videoFile) {
        await deleteFromCloudinary(video.videoFile, "video"); 
    }

    if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail, "image"); 
    }

    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(
      new ApiResponse(200, {}, "video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!mongoose.Types.ObjectId.isValid(videoId)){
      throw new ApiError(400, "invalid video ID");
    }

    const video = await Video.findByIdAndUpdate(
      videoId,
      [
        {
          $set: {
            isPublished: {
              $not: "$isPublished"
            }
          }
        }
      ],
      {
        new: true
      }
     )

     if(!video){
      throw new ApiError(404, "video not found")
     }

     return res.status(200).json(
      new ApiResponse(200, video, "Publish status updated successfully")
     )

})



export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}