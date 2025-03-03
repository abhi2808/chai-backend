import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true, //indexing helpful for faster search
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true,
    },
    avatar:{
        type:String, //cloudinary url
        required:true,
    },
    coverImage:{
        type:String, //cloudinary url
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required: [true, "Password is required"],
    },
    refreshToken:{
        type:String,
    }
},
{
    timestamps:true,
});

// direct encrytion not possible so we need to use hooks in mongoose
// pre hook is used to run some code before saving the document
// there are other types of hooks as well

userSchema.pre("save", async function(next){ //  arrow function not used because we need to use this keyword(context is important)
    //save is the action which is followed by the execution of inner function

    if(!this.isModified("password")) return next();

    this.password=await bcrypt.hash(this.password,10);
    next();
})

//like updateOne, deleteOne using mongoose we can create our own methods 
userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model("User",userSchema); 