import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js"


export const verifyJWT = async(req,res,next)=>{
    try {
        // take the access token
      const token = req.cookies?.accessToken || req.header("AUTHORIZATION")?.replace("Bearer ","");

      if(!token){
        throw new ApiError(400,"Unauthorized user")
      }  
     //verify the access token
      const verification = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
      // Find the user with true access token
      const user = await User.findById(verification?._id).select("-password -refreshToken")
      if (!user) {
          throw new ApiError(400,"Unauthorized user")
      }
       
      req.user = user;
      next();




    } catch (error) {
        console.error("error is ",error)
    }
}
