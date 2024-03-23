import mongoose from "mongoose";

const subscrSchema = new mongoose.Schema({
  subscribers : {
   type: mongoose.Schema.Types.ObjectId,
   ref:"User"
  },
  channel : {
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
   },


},{timestamps:true})


export const Subscribers = mongoose.model("Subscribers",subscrSchema)