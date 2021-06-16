const express = require("express")
const axios = require("axios")
const http = require("http")
const CognitiveServicesCredentials = require('@azure/ms-rest-azure-js').CognitiveServicesCredentials;
const WebSearchAPIClient = require('@azure/cognitiveservices-websearch');
const { urlencoded } = require("body-parser");

const clientId = "2150621969059.2156768505077";
const clientSecret = "2d640baa4b5dda2856a76d1bafb6f5b0";
const bingKey = "bb5afd75ef1944c785307526532721a8";

const port = process.env.PORT || 4390
const app = express()
let credentials = new CognitiveServicesCredentials(bingKey)
//let webSearchApiClient = new WebSearchAPIClient(credentials);

app.use('/', express.urlencoded({extended: true}))
app.use('/', express.json())



app.get("/", (req, res) => {
    res.write("Server is working", 'utf8', ()=> {
        console.log("writing to file");
    })
})

app.get('/oauth', (req,res) => {
    if (!req.query.code) {
        res.status(500).send(`Error code 500: Code not received`)

    }
    else {
        axios( {
            url: 'https://slack.com/api/oauth.access',
            qs: {code: req.query.code, client_id: clientId, client_secret: clientSecret},
            method: 'GET',
        }, (error, response, body) => {
            if (error) {
                console.log(error);
            }
            else {
                response.json(body);
            }
        })
    }
})

app.post('/', (req, res) => {
    
    const {challenge} = req.body;

    res.status(200).send(challenge);
})

app.post('/command', (req,res) => {
    

    
    const query = req.body.text;
    //console.log(req.body);

    axios.get('https://api.bing.microsoft.com/v7.0/news/search', {
        params: {
            q: query,
            count: "3",
            mkt: "en-us",
            safeSearch: "moderate"
        },
        headers: {
            "Ocp-Apim-Subscription-Key": bingKey
        }
    }).then((response) => {
        //console.log(response);
        var news_results = response.data.value;
        var fullResultsLink = "https://www.bing.com/news/search?q=" + encodeURIComponent(query)
        //console.log(response.data);
        var title;
        if (req.body.text === "") {
            title = "Today's Top Stories"
        }
        else {
            title = `News results for "${req.body.text}"` 
        }
        
        res.setHeader('Content-Type', 'text/json');

        let payloadHead = {
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
        res.write(payloadHead)

        for(let i = 0; i < news_results.length; i++) {
            
            //Some articles don't have a thumbnail
            //Pass blank url if thumbnail does not exist
            if (news_results[i].image) {
                imageUrl = news_results[i].image.thumbnail.contentUrl
            }
            else {
                imageUrl = "https://www.slack.com"
            }
            
            payloadBody = {

                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `*${news_results[i].name}*\n${news_results[i].description}`
                        },
                        "accessory": {
                            "type": "image",
                            "image_url": imageUrl,
                            "alt_text": "cute cat"
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
                                "url": news_results[i].url
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "Share to channel",
                                    "emoji": true
                                },
                                "value": "click_me_123",
                                "action_id": "actionId-0"
                            }
                        ]
                    },
                    {
                        "type": "divider"
                    }
                ]
            }
            //res.write("hello")
            res.write(JSON.stringify(payloadBody))
        }
        payloadFoot = {
            "blocks": [
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
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Share All",
                                "emoji": true
                            },
                            "value": "click_me_123",
                            "action_id": "actionId-0"
                        }
                    ]
                }
            ]
        }
        

        res.write(JSON.stringify(payloadFoot))
        res.end()

        //console.log(msgBody.blocks);
    
    }).catch((error) => {
        console.log(error);
        res.status(404).send(error)
    })
    
})

app.post('/message', (req, res) => {
    
    //console.log(req.body);
    const interactivePayload = JSON.parse(req.body.payload);
    console.log(interactivePayload);
    
    axios.post(interactivePayload.response_url, {
        
        params: {
            "replace_original": "true",
            "text": "This is temporrary message"
        }
    }).then((response) => {
        //console.log(response);
        res.end();
    }).catch((error) => {
        //console.log(error);
    })
})

app.listen(port, ()=> {
    console.log(`Server is listening on port ${port}`);
})