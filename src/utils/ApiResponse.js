class ApiResponse{
    constructor(statusCode, data, message="Success"){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success= statusCode < 400;
        /*
        information responses (100-199),
        successful responses (200-299),
        redirects (300-399),
        client errors (400-499),
        server errors (500-599).  
        */
    }
}

export {ApiResponse};