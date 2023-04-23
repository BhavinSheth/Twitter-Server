const { ValidationError } = require('../errors/custom-error')
const { StatusCodes } = require('http-status-codes')

const getErrorList = (errorObject) => {
  const newError = {}
  const keyList = Object.keys(errorObject)
  keyList.map((key) => {
    const singleError = errorObject[key].properties
    var { path, message } = singleError
    newError[path] = message
  })

  return newError
}

const errorHandlerMiddleware = (err, req, res, next) => {
  console.log(err)
  let defaultError = {
    // set default
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong try again later',
  }

  if (err.name === 'ValidationError') {
    const newErrors = getErrorList(err.errors)
    err = new ValidationError(newErrors)
    // return res.json(err)
    // defaultError.msg = Object.values(err.errors)
    //   .map((item) => item.message)
    //   .join(',')
    // defaultError.statusCode = 400
  }

  if (err instanceof ValidationError) {
    return res.status(StatusCodes.BAD_REQUEST).json({ errors: err.errors })
  }

  if (err.response && err.response.status == 429)
    return res
      .status(429)
      .json({ message: 'gpt free request limit is reached' })

  if (err.code && err.code === 11000) {
    defaultError.msg = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`
    defaultError.statusCode = 400
  }

  if (err.name === 'CastError') {
    defaultError.msg = `No item found with id : ${err.value}`
    defaultError.statusCode = 404
  }

  return res.status(defaultError.statusCode).json({ message: defaultError.msg })
}

module.exports = errorHandlerMiddleware
