class CustomAPIError extends Error {
  constructor(message) {
    super(message)
  }
}

class ValidationError extends Error {
  constructor(errors) {
    super()
    this.errors = errors
  }
}

module.exports = { CustomAPIError, ValidationError }
