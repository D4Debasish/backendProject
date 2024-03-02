import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {Cloudinaryup} from "../utils/cloudinary.js"
import {Apiresponse} from "../utils/Apiresponse.js"

const generateAccessandrefreshToken = async(id)=>{
    try {
        const user = await User.findById(id)
        const accessToken = await user.generateAccessToken();
        const refressToken = await user.generateRefreshToken();
        user.refreshToken = refressToken();
        await user.save({validateBeforeSave:false})

        return {accessToken, refressToken}
        
    } catch (error) {
        throw new ApiError(500,"Server error")
    }
}

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

//upload them to cloudinary so that we can get a url(string) and serve it as a string as directed in user model
     const avatarurl = await Cloudinaryup(avatarPath);// due to some reason cloudinary cant convert it to url
     const imageurl = await Cloudinaryup(coverImageLocalPath);
     console.log(avatarurl)
    //   if(!avatarurl){
    //      throw new ApiError(400,"Avatar is compulsary \\ or there may be cloudinary problem")
    //   }
//create a user object---{after creating the details we use object to add it to DB}
    const addtodb = {
        fullname,
        email,
        password,
        username : username,
        avatar: avatarurl?.url || "",
        coverImage: imageurl?.url || "",
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

const loginUser = async(res,req)=>{

    try {
         // request data from the user
         const {username,email,password} = req.body;
         console.log(username)
    //check if user is registered
      if (!username || !email){
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
    const {accessToken,refressToken} = await generateAccessandrefreshToken(user._id);
     // updated the user DB so that it adds the refreshToken
    const loggeduser = await User.findById(user._id).select("-password -refreshToken");
    
    //send tokens in the form of cookies
    const options = {
        httpOnly:true,
        secure:true,
    }
    res.status(200).
    cookie("accessToken",accessToken,options).
    cookie("refreshToken",refressToken,options).
    json(new Apiresponse(200,
        {
            user:loggeduser,accessToken,refressToken
        },
        "user is logged"
        ))
     
    

    } catch (error) {
        console.error("Error is :", error)
    }
}

export {registerUser,
        loginUser 
}