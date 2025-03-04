import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadonCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser= asyncHandler( async(req,res)=>{
    
    // get user detail from frontend
    // validation-not empty
    // check if user already exists: username, email
    // check for images/avatar
    // upload to cloudinary, avatar
    // create user object - entry in db
    // remave password and refresh token fields from response
    // check for user creation
    // return response

    const {fullname, email, username, password}=req.body
    //console.log(email)

    if(
        [fullname, email, username, password].some((filed) => filed?.trim()==="")
    ){
        throw new ApiError(400, "All firlds are required")
    }

    const existedUser=await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with username or email already exists")
    }

    //console.log(req.files);

    const avatarLoaclPath=req.files?.avatar[0]?.path;
    //const coverImageLocalPath= req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath= req.files.coverImage[0].path;
    }

    if(!avatarLoaclPath){
        throw new ApiError(400, "Avatar is required")
    }

    const avatar=await uploadonCloudinary(avatarLoaclPath);
    const coverImage=await uploadonCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar is required")
    }

    const user= await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while creating user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

export {registerUser}