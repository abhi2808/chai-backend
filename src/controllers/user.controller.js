import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadonCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt  from 'jsonwebtoken';
import mongoose from 'mongoose';

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

const generateAccessAndRefreshToken=async(userId)=>{
    try{
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

// to login user->
const loginUser=asyncHandler(async(req,res)=>{
    // req body -> data
    // username or email
    // find the user
    // check password
    // access and refresh token
    // send cookie

    const {email, username, password}=req.body

    if(!username && !email){
        throw new ApiError(400, "Username or email is required")
    }

    const user=await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials")
    }

    const {accessToken, refreshToken}=await generateAccessAndRefreshToken(user._id);

    // either update the database or update the currrent object

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in succcessfully"
        )
    )

}) 

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1 //removes field from the document
            }
        },
        {
            new: true
        }
    )

    const options={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {},"User logged Out"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
         throw new ApiError(401,"unauthorized request")
    }

    try {
        const decodedToken=jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !=user.refreshToken){
            throw new ApiError (401,"Refresh token is expired or used")
        }
    
        const options={
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newrefreshToken}=await generateAccessAndRefreshToken(user.id)
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Access token refreshed successful"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token")   
    }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword}=req.body
    
    const user=await User.findById(req.user?._id)

    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200,{},"password changed successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    // if need to update file use a seperate controller
    const {fullname, email}=req.body

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLoaclPath=req.file?.path
    if(!avatarLoaclPath){
        throw new ApiError(404, "Avatar file is missing")
    }

    const avatar=await uploadonCloudinary(avatarLoaclPath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Avatar updated successfully")
    )

})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLoaclPath=req.file?.path
    if(!coverImageLoaclPath){
        throw new ApiError(404, "CoverImage file is missing")
    }

    const coverImage=await uploadonCloudinary(coverImageLoaclPath)
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading avatar")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Cover Image updated successfully")
    )

})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel=await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField:"channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField:"subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404, "channel does not exist")
    }

    console.log(channel);

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0],"user channel fetched successfully")
    )

})

const getWatchHistory=asyncHandler(async(req,res)=>{
     const user=await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id) //mongoose.Types.ObjectId.createFromHexString() if improper hex code
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline: [
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
     ])

     return res
     .status(200)
     .json(new ApiResponse(200, user[0].watchHistory,"Watch History Fetched Successfully"))
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
    updateUserCoverImage, 
    getUserChannelProfile,
    getWatchHistory,
}