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
     return jwt.sign({
        _id: this.id,
        username : this.username,
        email: this.email,
        fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        ACCESS_TOKEN_EXPIRY
    }
    
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
       _id: this.id,
   },
   process.env.REFRESH_TOKEN_SECRET,
   {
       REFRESH_TOKEN_EXPIRY
   }
   
   )
}

export const User = mongoose.model('User',userSchema)