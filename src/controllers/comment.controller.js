import mongoose from "mongoose"
import { asyncHandler } from "../utility/asyncHandler.js"
import { ApiError } from "../utility/ApiError.js"
import { ApiResponse } from "../utility/ApiResponse.js"
import { Comment } from "../models/comment.model.js"

const getVideoComments = asyncHandler(async(req, res) => {
  const { videoId } = req.params
  const { page=1, limit=10 } = req.query

  if(!mongoose.Types.ObjectId.isValid( videoId )){
    throw new ApiError(400, "Invalid video ID")
  }

  if(page<0 || limit<0){
    throw new ApiError(400, "page or limit is not valid")
  }

  const exists = await Video.exists({
    _id: videoId
  })

  if(!exists){
    throw new ApiError(404, "Video not found")
  }

  const matchingComments = Comment.aggregate(
    [
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId)
        }
      }
    ]
  )

  const options = {
    page, limit
  }

  const comments = await Comment.aggregatePaginate(matchingComments, options)

  return res.status(200).json(
    new ApiResponse(200, comments, "comments fetched successfully")
  )
  
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body

    if(!userId){
      throw new ApiError(401, "user not logged in")
    }
    if(!content){
      throw new ApiError(400, "Content of the comment can not be empty")
    }

    const comment = await Comment.create({
      content,
      video: videoId,
      owner: userId
    })

    return res.status(201).json(
      new ApiResponse(201, comment, "comment created successfully!!")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { newContent } = req.body
    const  userId  = req.user._id

    if(!newContent){
      throw new ApiError(400, "comment can not be empty")
    }

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: {
          content: newContent
        }
      },
      {
        new: true
      }
    )

    if(!comment){
      throw new ApiError(404, "Comment not found")
    }

    return res.status(200).json(
      new ApiResponse(200, comment, "Comment updated successfully")
    )
    
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params


    const comment = await Comment.findByIdAndDelete(commentId)

    if(!comment){
      throw new ApiError(404, "Comment not found")
    }

    return res.status(200).json(
      new ApiResponse(200, {}, "Comment deleted successfully")
    )
})



export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
}