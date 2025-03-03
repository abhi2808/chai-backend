import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));


//jub form bahrne me data ata hai for then->
app.use(express.json({limit: "16kb"})); //earlier needed body parser, we use multer for file parsing

//jub data url se aayega (kahin +, kahin %20)->
app.use(express.urlencoded({extended: true, limit: "16kb"}));

//to store public assets->public=>name of folder
app.use(express.static("public"));

//perform crud operations on cookies->
app.use(cookieParser());


//routes import
import userRouter from './routes/user.routes.js';


//routes declaration
app.use("/api/v1/users", userRouter)


export {app}
