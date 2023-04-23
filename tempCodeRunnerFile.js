var content =
//   'never give up on your life. \nIn what category will above text fall? '
//     .concat(categoryArray.map((str) => str))
//     .concat(
//       '. pls give one worded ans with correct spelling from above categories only, with no full-stop and extra-spaces and lowercase'
//     )

// // content =
// //   'does directly writing text and classifying is easy or i should do training and all that'

// console.log(content)
// openai
//   .createChatCompletion({
//     model: 'gpt-3.5-turbo',
//     messages: [
//       {
//         role: 'user',
//         content: content,
//       },
//     ],
//   })
//   .then((res) => {
//     console.log(res.data.choices[0].message.content)
//   })
