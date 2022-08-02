/*****************************************************************
Router for handling requests for news searches. API Call is made
to Microsoft's Bing Web Search API with inputted search query.
Leaving query blank will auto return top stories. Web Search API
is enabled as an Azure resource. Axios is used for making HTTP
requests.

Yashvin Vedanaparti 6-17-21
*****************************************************************/

const express = require('express')
const axios = require('axios')
const newsRouter = express.Router()
const {WebClient} = require("@slack/web-api")
require('dotenv').config()

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN)
const BING_SEARCH_URL = "https://www.bing.com/news/search?q=";
const BING_API_URL = 'https://api.bing.microsoft.com/v7.0/news/search';

newsRouter.post('/', async (req, res) => {
    const query = req.body.text;
    const channelId = req.body.channel_id;

    //GET request to Bing API with query
    await axios.get(BING_API_URL, {
        params: {
            q: query,
            count: "3",                     //Max number of results to return
            mkt: "en-us",                   //US market
            safeSearch: "moderate"
        },
        headers: {
            "Ocp-Apim-Subscription-Key": process.env.BING_KEY
        }
    }).then(async (response)=> {

        var newsResults = response.data.value;
        var fullResultsLink = BING_SEARCH_URL + encodeURIComponent(query)

        //Set response title to "Today's Top Stories" if no query provided
        var title;
        if (req.body.text === "") {
            title = "Today's Top Stories"
        }
        else {
            title = `News results for "${req.body.text}"` 
        }

        //Header for block response
        let newsBlocks = {
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": title,
                        "emoji": true
                    }
                },
                {
                    "type": "divider"
                }
            ]
        }

        //Loop to push each search result in block format to blocks array
        for(let i = 0; i < newsResults.length; i++) {
            
            //Some articles don't have a thumbnail
            //Pass slack url if thumbnail does not exist
            if (newsResults[i].image) {
                imageUrl = newsResults[i].image.thumbnail.contentUrl
            }
            else {
                imageUrl = "https://www.slack.com"
            }
            
            newsBlocks.blocks.push(

                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `*${newsResults[i].name}*\n${newsResults[i].description}`
                        },
                        "accessory": {
                            "type": "image",
                            "image_url": imageUrl,
                            "alt_text": `image_${i}`
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "Go to Article"
                                },
                                "value": "click_me_123",
                                "url": newsResults[i].url
                            },
        
                        ]
                    },
                    {
                        "type": "divider"
                    }
            )
        }

        //Footer for blocks response
        newsBlocks.blocks.push(
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": "Results from Bing"
                        },
                        
                    ]
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "emoji": true,
                                "text": "Full Search Results"
                            },
                            "value": "click_me_123",
                            "url": fullResultsLink
                        }
                    ]
                }
        )
        //Try posting slack message as bot, if private channel, try posting as user
        try {
            await slackClient.chat.postMessage( {
                "channel": channelId,
                "text": "Bingo sent a message",
                "blocks": newsBlocks.blocks
            })
        }catch(error) {
            if(error.data.error === 'channel_not_found') {
                //In private DMs, Bot cannot post, so will post as user instead
                await slackClient.chat.postMessage( {
                    "token": process.env.SLACK_USER_TOKEN,
                    "channel": channelId,
                    "text": `Bingo sent a message`,
                    "blocks": newsBlocks.blocks
                })
            }
            else {
                //Return error code if both attempts fail
                res.send(`Bingo failed with error: ${error.data.error}`)
            }
        }

        res.end()

    }).catch((error) => {
        //Return error and log console if Axios GET request fails
        console.log(error);
        res.send(`Bingo failed with error: ${error.data.error}`)
    })

})

module.exports = newsRouter