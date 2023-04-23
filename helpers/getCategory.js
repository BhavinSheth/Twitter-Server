const { Configuration, OpenAIApi } = require('openai')

const { categoryArray } = require('../constants')
const parseCategory = require('./parseCategory')

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPEN_AI_KEY,
  })
)

const getCategory = async (tweet) => {
  const requiredCategories = ''.concat(
    categoryArray.map((category) => category)
  )
  const conditions =
    '. \nConditions: text may contain hastages,ignore hashtag character, ans should be one worded, it should be from above categories only, correct spelling, with no full-stop and extra-spaces and lowercase and extra characters. above conditions are mandatory'

  var content = `${tweet}.\nIn what category will above text fall? \n`
    .concat(requiredCategories)
    .concat(conditions)

  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: content,
      },
    ],
  })
  const category = res.data.choices[0].message.content
  const parsedCategory = parseCategory(category)
  console.log('GPT category : ', category)
  console.log('Parsed category : ', parsedCategory)

  return parsedCategory
}

module.exports = getCategory
