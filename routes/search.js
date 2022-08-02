/*****************************************************************
Router for handling requests for web searches. API Call is made
to Microsoft's Bing Web Search API with inputted search query.
Leaving query blank will prompt for input. Web Search API
is enabled as an Azure resource. Axios is used for making HTTP
requests.

Yashvin Vedanaparti 6-17-21
*****************************************************************/


const express = require('express')
const axios = require('axios')
const searchRouter = express.Router()
const {WebClient} = require("@slack/web-api");
require('dotenv').config()

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN)
const BING_SEARCH_URL = "https://www.bing.com/search?q=";
const BING_API_URL = 'https://api.bing.microsoft.com/v7.0/search';

searchRouter.post('/', async (req, res) => {
    
    const query = req.body.text;
    const channelId = req.body.channel_id;

    //Prompt for input if query is empty
    if(query === "") {
        return res.send("Please enter a valid search query")
    }

    //GET request to Bing API with query
    axios.get(BING_API_URL, {
        params: {
            q: query,
            count: "3",                     //Max number of search results to return
            mkt: "en-us",                   //Search US market
            safeSearch: "moderate"
        },
        headers: {
            "Ocp-Apim-Subscription-Key": process.env.BING_KEY
        }
    }).then(async (response) => {

        var searchResults = response.data.webPages.value;
        var fullResultsLink = BING_SEARCH_URL + encodeURIComponent(query)

        //Header for block response
        let searchBlocks = {
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": `Search Results for "${query}"`,
                        "emoji": true
                    }
                },
                {
                    "type": "divider"
                }
            ]
        }
        //Loop to push each search result in block format to blocks array
        for(let i = 0; i < searchResults.length; i++) {
            
            searchBlocks.blocks.push(
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `*${searchResults[i].name}*\n${searchResults[i].snippet}`
                        },
                        
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "View Result"
                                },
                                "value": "click_me_123",
                                "url": searchResults[i].url
                            },
                        ]
                    },
                    {
                        "type": "divider"
                    }
            )
        }

        //Footer for blocks response
        searchBlocks.blocks.push(
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
                    },
                ]
            }
        )
        //Try posting slack message as bot, if private channel, try posting as user
        try {
            await slackClient.chat.postMessage( {
                "channel": channelId,
                "text": "Bingo sent a message",
                "blocks": searchBlocks.blocks,
            })
        }catch(error) {
            if(error.data.error === 'channel_not_found') {
                //In private DMs, Bot cannot post, so will post as user instead
                await slackClient.chat.postMessage( {
                    "token": process.env.SLACK_USER_TOKEN,
                    "channel": channelId,
                    "text": `Bingo sent a message`,
                    "blocks": searchBlocks.blocks
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

module.exports = searchRouter