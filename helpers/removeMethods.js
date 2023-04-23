Array.prototype.removeElement = function (id) {
  this.splice(this.indexOf(id), 1)
}

Array.prototype.isFound = function (id) {
  return this.some((mongooseId) => {
    return id == mongooseId
  })
}
