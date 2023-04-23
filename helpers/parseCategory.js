const parseCategory = (category) => {
  if (category.startsWith('\n\n')) return category.split('\n\n')[1]
  return category.trim().toLowerCase()
}

module.exports = parseCategory
