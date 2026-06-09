import {asyncHandler} from '../utility/asyncHandler.js'
import { ApiError } from '../utility/ApiError.js';
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utility/cloudinary.js"
import { ApiResponse } from '../utility/ApiResponse.js';
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId) => {
  try{
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

    return {accessToken, refreshToken}
  } catch(error){
    throw new ApiError(500, "Something went wrong while generating tokens")
  }
}


const registerUser = asyncHandler(async(req, res) => {
  //taking user details
  const {username, fullName, email, password} = req.body;


  //validating user details
  if(
    [username, fullName, email, password].some((field) => (!field) || field.trim() === "")
  ){
    throw new ApiError(400, "All fields are required");
  }


  //check if the user already exists
  const existedUser = await User.findOne({
    $or: [{username}, {email}]
  })
  if(existedUser){
    throw new ApiError(409, "User with username or email already exists")
  }


  //check for images, avatar.
  const avatarLocalPath = req.files?.avatar?.[0]?.path;          //req.files is given by the middleware
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if(! avatarLocalPath) throw new ApiError(400, "Avatar is required");


  //upload to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if(!avatar) throw new ApiError(400, "Avatar file is required");


  //create an object of registered user
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase() 
  })


  //remove password and refreshToken from response
  const createdUser = await User.findById(user._id).select("-password -refreshToken");     //database calls require await;
  

  //check for user creation
  if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering the user");
  }


  //send response
  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  );

})

const loginUser = asyncHandler(async(req, res) => {
  // take information from the request
  const {username, email, password} = req.body
  console.log(req.body)

  if(!username && !email){
    throw new ApiError(400, "Username or email is required")
  }

  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  if(!user){
    throw new ApiError(404, "User doesn't exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if(!isPasswordValid){
    throw new ApiError(401, "Invalid user credentials")
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true               //cookies by default can be modified by the frontend
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        refreshToken,
        accessToken
      },
      "User logged In Successfully"
    )
  )

})

const logoutUser = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(
    new ApiResponse(
      200, {}, "User logged out successfully"
    )
  )
})

const refreshAccessToken = asyncHandler(async(req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?._id)
    if(!user) throw new ApiError(401, "Invalid refresh token")
    
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token is expired or used")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
    return res.
    status(200)
    .cookie("refreshToken", newRefreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(
      200,
      {accessToken, refreshToken: newRefreshToken},
      "Access token refreshed successfully"
    ))
  } catch (error) {
    throw new ApiError(401, error?.message||"invalid refresh token")
  }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
  const {oldPassword, newPassword} = req.body
  const user = await User.findById(req.user._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect) throw new ApiError(400, "Old password is not correct")

  user.password = newPassword
  user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(
    200, {}, "Password updated successfully"
  ))

})

const getCurrentUser = asyncHandler(async(req, res) => {
  return res
  .status(200)
  .json(new ApiResponse(
    200, {user: req.user}, "User fetched"
  )) 
})

const updateAccountDetails = asyncHandler(async(req, res) => {
  const {fullName, email} = req.body
  if(!fullName || !email){
    throw new ApiError(401, "full name or email is required")
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {fullName, email}
    },
    {new: true}    //updated user will be returned
  ).select("-password -refreshToken")

  // user.fullName = fullName
  // user.email = email
  // user.save()

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400, "Something went wrong while uploading on cloudinary")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {avatar: avatar.url}
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(new ApiResponse(
    200, user, "Avatar updated"
  ))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover image file is missing")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400, "Something went wrong while uploading on cloudinary")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {coverImage: coverImage.url}
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(new ApiResponse(
    200, user, "Cover image updated"
  ))
})
 




export {
  registerUser,
  loginUser, 
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
};