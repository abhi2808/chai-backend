//require("dotenv").config({path: "../.env"});
import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
});

import {app} from "./app.js";
import mongoose, { connect } from "mongoose";
import {DB_NAME} from "./constants.js";
import connectDB from "./db/index.js";


/*
(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error",()=>{
            console.log("Error: ",error);
            throw error;
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    }catch(error){
        console.log("Error: ",error)
        throw error;
    }
})()
*/

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port ${process.env.PORT}`);
    })
})
.catch(error=>{
    console.log("MONGODB connection fail!");
    throw error;
})