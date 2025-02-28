const asynHandler=(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((err)=>next(err))
    }
}

export {asynHandler}

/*
const asyncHandler=(fn)=>{ //wrapper function, higher order function that takes a function as an argument and returns a new function that returns a promise
    async (req,res,next)=>{
        try{
            await fn(req,res,next)
        }catch(error){
            res.status(error.code||500).json({
                sucess: false,
                message: error.message
            })
        }
    }
}
*/