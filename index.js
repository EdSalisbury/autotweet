const config = require('./config');
const twitter = require('twitter-lite');
const client = new twitter(config);

const tweet = "Let's play videos: do you like to see a talking head or not?"
client.post('statuses/update', { status: tweet }).then(result => {
  console.log('You successfully tweeted this : "' + result.text + '"');
}).catch(console.error);