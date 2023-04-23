const getFormattedDate = (date) => {
  date = new Date(date)
  const newDate = {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hour: date.getHours(),
    min: date.getMinutes(),
    second: date.getSeconds(),
  }

  return newDate
}

module.exports = getFormattedDate
