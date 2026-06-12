import mongoose from "mongoose";
import { asyncHandler } from "../utility/asyncHandler.js";
import { ApiError } from "../utility/ApiError.js";
import { ApiResponse } from "../utility/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const userId = req.user?._id
    if(!userId){
      throw new ApiError(401, "user not logged in")
    }

    const { content } = req.body
    if(!content){
      throw new ApiError(400, "Tweet cannot be empty")
    }

    const tweet = await Tweet.create({
      owner: userId,
      content: content
    })

    return res.status(200).json(
      new ApiResponse(200, tweet, "Tweet successfully created")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const tweets = await Tweet.find({ owner: userId });

    return res.status(200).json(
        new ApiResponse(200, tweets, "User tweets fetched successfully")
    );
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    if (!content) {
        throw new ApiError(400, "Content is required to update tweet");
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content } },
        { new: true }
    );

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    );
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    );
})



export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}