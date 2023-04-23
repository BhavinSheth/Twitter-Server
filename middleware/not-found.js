const notFound = (req, res) => {
  res.status(404).send(`Route does not exist ${req.url}`)
}

module.exports = notFound
