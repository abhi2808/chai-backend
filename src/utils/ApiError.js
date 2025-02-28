class ApiError extends Error {
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""
    ){
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success=false;
        this.errors = errors;

        if(stack){ //to get stack trace, ki kin kin files me error hai
            this.stack=stack;
        }else{
            Error.captureStackTrace(this, this.constructor);
        }
    } 
}

export {ApiError};