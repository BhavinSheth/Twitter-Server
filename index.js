const express = require('express')
const app = express()
const connectDb = require('./db/connect')
const mongoose = require('mongoose')

var cors = require('cors')

require('dotenv').config()
require('express-async-errors')
require('./helpers/removeMethods')

const errorHandlerMiddleware = require('./middleware/error-handler')
const notFoundMiddleware = require('./middleware/not-found')

const userRouter = require('./routers/userRouter')
const authRouter = require('./routers/authRouter')
const tweetRouter = require('./routers/tweetRouter')
const hashtagRouter = require('./routers/hashtagRouter')

app.use(cors())

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.use(hashtagRouter)
app.use(authRouter)
app.use(tweetRouter)
app.use(userRouter)

app.use(errorHandlerMiddleware)
app.use(notFoundMiddleware)

const port = 3000

const start = async () => {
  mongoose.set('strictQuery', false)
  try {
    await connectDb(process.env.KEY)
    app.listen(port, (req, res) => {
      console.log(`server is listening on port : ${port}`)
    })
  } catch (error) {
    console.log(error)
  }
}
start()
