/*****************************************************************
This is the main program for Bingo slack app. Incoming requests
are for web search or news search slack commands. Express routers are used for
handling respective requests

Using Node.js with the Express framework

Yashvin Vedanaparti 6-17-21
*****************************************************************/

const express = require("express")
const newsRouter = require('./routes/news')
const searchRouter = require('./routes/search')


const port = process.env.PORT || 4390
const app = express()

//Middleware for parsing urlencoded and json formats
app.use('/', express.urlencoded({extended: true}))
app.use('/', express.json())

//News slash command uses newsRouter
app.use('/news', newsRouter)

//Bing slash command uses searchRouter
app.use('/search', searchRouter)

//Respond with acknowledge 200 for interactive elements
app.post('/message', (req,res) => {
    res.status(200).end()
})

app.listen(port, ()=> {
    console.log(`Server is listening on port ${port}`);
})
