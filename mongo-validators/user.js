const mobile_no_validator = function (value) {
  if (value.length < 10 && value.length > 0)
    throw new Error('mobile number is less than 10')
  else if (value.length > 10)
    throw new Error('mobile number is greater than 10')
}

module.exports = { mobile_no_validator }
