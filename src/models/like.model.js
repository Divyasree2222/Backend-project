import mongoose, {Schema} from 'mongoose';
import { ApiError } from "../utility/ApiError.js"

const likeSchema = new Schema({
  comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment"
  }, 
  video: {
      type: Schema.Types.ObjectId,
      ref: "Video"
  },
  likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
  },
  tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet"
  }
}, {timestamps: true})



likeSchema.pre('validate', function () {
    if (!this.comment && !this.video && !this.tweet) {
        throw new ApiError('A like must be associated with a comment, video, or tweet.');
    } 
});

export const Like = mongoose.model("Like", likeSchema)