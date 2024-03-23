import mongoose from "mongoose"
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'


const userSchema = new mongoose.Schema({
   username:{
    type: String,
    required: true,
    unique: true,
    lowercase: true,
   },
   email:{
    type: String,
    required: true,
    unique: true,
   },
   fullname:{
    type: String,
    required: true,
   },
   avatar:{
    type:String,

   },
   coverImage:{
    type:String
   },
   password:{
    type:String,
    required:true,
   },
   refreshToken:{
    type:String,
  
   },
   watchHistory:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video"
   }]


},{timestamps:true});

userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,10)
        next();
    }
    else{
        return next();
    }   
})
userSchema.methods.checkpass = async function(password){
  return await  bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: "1d"
    }
    
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRERSH_TOKEN_STRING,
   {
    expiresIn:"20h"
   }
   
   )
}

export const User = mongoose.model('User',userSchema)