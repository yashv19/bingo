//This file contains functions that were tested but are not included
//in the actual program. It is stored here in case the functionality is
//is ever needed in the future.
//
// Yashvin Vedanaparti 6/17


//Function uses conversations:history method to retrieve a single message based
//on the message timestamp. Need to pass in the timestamp and the channelId
//Time stamp of ephemeral messages will not retrieve the ephermal msg, as they cannot
//be retrieved
async function getMessage(channelId, message_ts) {

    try {
        const result = await slackClient.conversations.history({
            channel: channelId,
            token: userToken,
            inclusive: true,
            latest: message_ts,
            limit: 1
        })
        const message = result.messages[0]
        //console.log(message);
        return message;

    }catch (error) {
        console.log(error);
    }

}

//Handle the payload from an interactive element
//Current app's interactive elements only load urls
app.post('/message', async (req, res) => {
    
    //console.log(req.body);
    const interactivePayload = JSON.parse(req.body.payload);
    //console.log(interactivePayload);

    const channelId = interactivePayload.channel.id
    const message_ts = interactivePayload.container.message_ts
    const answer = getMessage(channelId, message_ts)

    
    await slackClient.chat.postMessage( {
        "channel": channelId,
        "text": "Reply recieved, I am replying",
        "blocks": [
            {
                "type": "divider"
            }
        ]
    })

    res.end()

})