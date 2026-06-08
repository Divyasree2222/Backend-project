import { ApiError } from "../utility/ApiError"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

const verifyJWT = asyncHandler((req, res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

  try{
    if(!token){
      throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    if(!user){
      throw new ApiError(401, "Invalid token")
    }

    req.user = user
    next()
  } catch(error){
    throw new ApiError(401, error?.message || "Invalid access token")
  }
})

export {verifyJWT}