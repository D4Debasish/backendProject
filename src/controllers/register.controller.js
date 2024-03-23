import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {Apiresponse} from "../utils/Apiresponse.js"
import jwt from "jsonwebtoken"
import fs from "fs"
import mongoose from "mongoose"

const deletefile= async(file)=>{
  try {
    if(!fs.existsSync(file)){
        throw new ApiError(400,"Cant find the file path")
    }
    fs.unlinkSync(file)
  } catch (error) {
    throw new ApiError(400, "Cant delete the file")
  }
}

const generateAccessandrefreshToken = async(id)=>{
    try {
        const user = await User.findById(id)
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500,"Server error")
    }
}
// register the user
const registerUser = async(req,res)=>{
    try {
// get user details from frontend-----{we can access it using <<<req.body>>>}
         const {username,fullname,email,password} = req.body;
         
//validate if a field is empty----{check if one of the field is empty and if it is then show a api error}
         if([username,fullname,email,password].some((field)=> field?.trim ==="")){
            throw new ApiError(400, "The fields should not be EMPTY")
         }
         
//check if user already exist......we use findone method to check for username or email
         const existedname= await User.findOne({
            $or:[{username}]
        })
        if(existedname){
            throw new ApiError(409,  `   user with ${username} already exist`)
        }
        const existedemail= await User.findOne({
            $or:[{email}]
        })
        if(existedemail){
            throw new ApiError(409,  `   user with ${email} already exist`)
        }
         
//upload the images,avatar on local server through multer......... check for images, avatars
       const avatarPath =  req.files?.avatar[0]?.path;
       console.log(avatarPath)
       let coverImageLocalPath;
       if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
           coverImageLocalPath = req.files.coverImage[0].path
       }

       if(!avatarPath){
          throw new ApiError(400, "Avatar is compulsary,....upload it")
       }

//create a user object---{after creating the details we use object to add it to DB}
    const addtodb = {
        fullname,
        email,
        password,
        username : username,
        avatar: avatarPath || "",
        coverImage: coverImageLocalPath || "",
    }

     const userdb= await User.create(addtodb);
    
//remove password and refresh token from response
const createdUser = await User.findById(userdb._id).select(
    "-password -refreshToken"
 )
 if(!createdUser){
    throw new ApiError(500,"SORRY OUR PROBLEM")
 }
//check if user is created ----{return response if created}
    return res.status(200).json(
      new Apiresponse(200, "Successfully Registered", createdUser )

    )

    } 
    
    catch (error) {
        console.error('Error in register:', error);
        res.status(400).json(
            
            {
            message:'Error in register'+ error.message
        })
    }
}
// login for user

const loginUser = async(req,res)=>{
    try {
         // request data from the user
         const {email, username, password} = req.body
         console.log(email)
    //check if user is registered
      if (!username && !email){
        throw new ApiError(400, "User not available")
      }
    //find the user
    const user = await User.findOne({$or:[{username}, {email}]})
     if (!user) {
         throw new ApiError(400,  "Either username or email is not registered")
     }
    //password check
      const checkpassword= await user.checkpass(password);
      if(!checkpassword){
        throw new ApiError(400, "Incorrect Password");
      }
    //access and refresh token 
    const {accessToken,refreshToken} = await generateAccessandrefreshToken(user._id);
     // updated the user DB so that it adds the refreshToken
    const loggeduser = await User.findById(user._id).select("-password -refreshToken");
    
    //send tokens in the form of cookies
    const options = {
        httpOnly:true,
        secure:true,
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new Apiresponse(
            200, 
            {
                user: loggeduser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
    } catch (error) {
        console.error("Error in login user :", error)
    }
}
// access token refresh by generating new refreshtoken
const refreshTokenaccess = async(req,res)=>{
    try {
        // extract the refresh token from cookies

        const commingtoken = req.cookies?.refreshToken || req.body.refreshToken;
        if (!commingtoken) {
            throw new ApiError(400 ,"invalid user")
        }
        //  verify
      try {
         const decodedToken =  jwt.verify(commingtoken,REFRERSH_TOKEN_STRING);
         if (!decodedToken) {
            throw new ApiError(400 ,"invalid user")
         }
         // extract the id from it

         const user = await User.findById(decodedToken?._id);
         // match the token with the one in db
         if (commingtoken !== user?.refreshToken) {
            throw new ApiError(400 ,"invalid user")
         }
         // if matched then generate a accesstoken and a refreshtoken
         
         const {accessToken, newrefreshToken} = await generateAccessandrefreshToken(user._id);
         const options = {
            httpOnly:true,
            secure:true,
        }
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)   // if error check for the generateaccessandrefresh
        .json(
            new Apiresponse(
                200, 
                {
                    user:  accessToken, newrefreshToken
                },
                "Token accessed In Successfully"
            ))
      } catch (error) {
        throw new ApiError(400, " Token Verify indise decoded one error")
      }

        
    } catch (error) {
        throw new ApiError(400,"RTA error", error)
    }
}
// cahange the password
const changepass = async(req,res)=>{
    const {oldPassword, newPassword, confirmPassword} = req.body;
    // check if the oldpasword is same as the password in db
   const user= await User.findById(req.user?._id);
   if(!(user.password === oldPassword)){
    throw new ApiError(400,"wrong password")
   }
   // if alright then set the new password as the main password and save
   user.password = newPassword;
   await user.save({validateBeforeSave:false})
   // confirm new password
   if (!(newPassword===confirmPassword)) {
       throw new ApiError(400,"New Password not matched")
   }
   //return it
   return res.status(200).json(new Apiresponse(200,{},"successfully changed your password "))
}
// get the user
const getCurrentUser = async(req,res)=>{
    try {
        // verify if the user is logged in....done by middleware.
        //get the user
       const user = req.user;
      res.status(200)
      .json(new Apiresponse(200,{user},"the current user is this"))

    } catch (error) {
        throw new ApiError(400,"error in getting currentUser")
    }
}
// change the avatar file
const avatarChange = async(req,res)=>{
    try {
       const avartarfile= req.files?.path;
       if (!avartarfile) {
        throw new ApiError(400,"Cant find avatar")        
       }
       const user = await User.findById(req.user?._id);
       if (!user){
        throw new ApiError(400, "No user");
       }
       if(user.avatar){
        await deletefile(user.avatar)
       }
       
       const updateduser = await User.findByIdAndUpdate(req.user?._id,
        {
           $set :{ avatar:avartarfile }
        },
        {
           new:true
        }).select("-password")

        return res.status(200)
        .json(new Apiresponse(200,{updateduser}, "your avatar is successfully changed"))
        
    } catch (error) {
        throw new ApiError(400,"Cant change avatar")
    }
}
// logout the user
const logoutuser = async(req,res)=>{
  try {
    //access the db for user details by req.user._id as it comes from the middleware
     await User.findByIdAndUpdate(req.user._id,{
        //remove the Tokens
        $set:{
            refreshToken: undefined
        }
     },{
        new:true
     })
    //Clear the cookies
     const options = {
        httpOnly:true,
        secure:true,
    }
    return res.status(200).
    clearCookie("accessToken",options).
    clearCookie("refreshToken",options).
    json(new Apiresponse(200,"User Logged Out"))

     
    
    //redirect to "/" 
  } catch (error) {
    console.error("Error in logout user:",error)
  }
}

const getUserProfile =async(req,res)=>{
  try {
    const {username} = req.params;
    if(!username){
        throw new ApiError(400, "No user")
    }

   const channel =  await User.aggregate([{
        $match:{username:username?.toLowerCase()}
    },
    {
        $lookup:{
            from:"subscriptions",
            localField: "_id",
            foreignField:"channel",
            as: "subscribedChannels",
        }
    },
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:" subscribers",
            as:"ChannelItSubscribed"
        }
    },
    {
        $addFields:{
            subscribersCOunt:{
                $size: "$subscribedChannels"
            },
            channelItsubscriberCount :{
                $size:"$ChannelItSubscribed"
            },
            isSubscribed:{
                $cond: {
                    if:{$in :[req.user?._id, "$subscribedChannels.subscriber"]},
                    then : true,
                    else:false
                }
            }

        }
    },
    {
        $project:{
            fullname:1,
            username:1,
            subscribersCOunt:1,
            channelItsubscriberCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1,
        }
    }
])
if (!channel?.length){
    throw new ApiError(400, "in 360");
}

  return res.status(200).
           json(
    new Apiresponse(200, channel[0], "successfully fetched")
)
    
  } catch (error) {
    throw new ApiError(400,"Error in getting user")
  }
}

const watchistory = async (req,res)=>{
    try {
     const user = await User.aggregate([{
        $match:{
            _id: new mongoose.Types.ObjectId(req.user._id)
        },
        
      },
      {
        $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[{
                $lookup:{
                    from:"users",
                    localField:"videoOwner",
                    foreignField:"_id",
                    as:"ownerid",
                    pipeline:[{
                        $project:{
                            fullname:1,
                            username:1,
                            avatar:1,
                        }
                    }]
                }
            },{
                $addFields:{
                    owner:{
                        $first: "$owner"
                    }
                }
            }]
        }
      }
    
    ])

    return res.status(200).json(
        new Apiresponse(200, user[0].watchistory, "successfully shown user history")
    )


        
    } catch (error) {
        throw new ApiError(400,`Error in watchHistory is  ${error}`)
    }
}

export {registerUser,
        loginUser,
        refreshTokenaccess,
        logoutuser,
        changepass,
        getCurrentUser,
        avatarChange,
        getUserProfile ,
        watchistory
}

