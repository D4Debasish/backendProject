class ApiError extends Error{
    constructor(
        statuscode,
        message ="Something went worong",
        errors = [],
        stack = ""
    ){
        super(message),
        this.statuscode = statuscode,
        this.message = message,
        this.data = null,
        this.errors = errors,
        this.stack = stack

    }
}

export {ApiError}