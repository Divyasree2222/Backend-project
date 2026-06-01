class ApiError extends Error{
  constructor(
    statusCode,
    message="Something went wrong",
    data,
    errors=[],
    stack=""
  ){
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.data = null;
    this.errors=errors;

    if(stack){
      this.stack = stack;
    } else{
      Error.captureStackTrace(this, this.contructor)
    }
  }
}

export {ApiError}