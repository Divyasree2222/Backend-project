import {asyncHandler} from '../utility/asyncHandler.js'
import { ApiError } from '../utility/ApiError.js';
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utility/cloudinary.js"
import { ApiResponse } from '../utility/ApiResponse.js';

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
  const avatarLocalPath = req.files?.avatar[0]?.path;          //req.files is given by the middleware
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

export {registerUser};