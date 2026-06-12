import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utility/ApiError.js"
import {ApiResponse} from "../utility/ApiResponse.js"
import {asyncHandler} from "../utility/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const userId = req.user?._id;

    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Unliked video successfully"));
    }

    const newLike = await Like.create({ video: videoId, likedBy: userId });
    return res.status(200).json(new ApiResponse(200, { liked: true, like: newLike }, "Liked video successfully"));
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const userId = req.user?._id;

    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Unliked comment successfully"));
    }

    const newLike = await Like.create({ comment: commentId, likedBy: userId });
    return res.status(200).json(new ApiResponse(200, { liked: true, like: newLike }, "Liked comment successfully"));
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const userId = req.user?._id;

    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Unliked tweet successfully"));
    }

    const newLike = await Like.create({ tweet: tweetId, likedBy: userId });
    return res.status(200).json(new ApiResponse(200, { liked: true, like: newLike }, "Liked tweet successfully"));
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id;

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoInfo"
            }
        },
        {
            $unwind: "$videoInfo"
        },
        {
            $lookup: {
                from: "users",
                localField: "videoInfo.owner",
                foreignField: "_id",
                as: "videoInfo.ownerInfo",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$videoInfo.ownerInfo"
        }
    ]);

    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}