import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utility/ApiError.js"
import {ApiResponse} from "../utility/ApiResponse.js"
import {asyncHandler} from "../utility/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscriberId = req.user?._id;

    if (!subscriberId) {
        throw new ApiError(401, "User is not logged in");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    });

    if (existingSubscription) {
        // Unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(
            new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully")
        );
    }

    // Subscribe
    const newSubscription = await Subscription.create({
        subscriber: subscriberId,
        channel: channelId
    });
    return res.status(200).json(
        new ApiResponse(200, { subscribed: true, subscription: newSubscription }, "Subscribed successfully")
    );
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
      throw new ApiError(400, "Invalid channel ID")
    }

    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscribersInfo",
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
        $unwind: "$subscribersInfo"
      },
      {
        $project: {
          subscribersInfo: 1,
          createdAt: 1
        }
      }
    ])

    return res.status(200).json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelInfo",
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
            $unwind: "$channelInfo"
        },
        {
            $project: {
                channelInfo: 1,
                createdAt: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}