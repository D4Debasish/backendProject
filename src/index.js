
import connectDB from "./db/index.js";
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import {app} from './app.js'
const port = 5000;
connectDB().
then(()=>{
    app.on("ERROR",(error)=>{
        console.log(error) }
        )
    app.listen(port,()=>{
        console.log(`server is running at ${port}`)
    })
})
.catch((err)=>{
    console.log("ERROR is :",err)
})

