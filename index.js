// Autotweet for new youtube videos
// Ed Salisbury
// Last Modified: 09/24/2021

const datefns = require('date-fns');
const config = require('./config');
const apiClient = config.newClient();
const uploadClient = config.newClient('upload');
const axios = require('axios').default;

const Parser = require('rss-parser');
const parser = new Parser();
const channelId = "UC9T7-AwG8ECs7AzmVHovQ8A"

const getBase64 = async(url) => {
  try {
    const response = await axios.get(url, {responseType: 'arraybuffer'});
    return Buffer.from(response.data, 'binary').toString('base64');
  } catch(e) {
    error.log(e)
  }
}

const getVideos = async() => {
  try {
    const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
  } catch(e) {
    console.log("Error getting video feed")
    return
  }
  const oneHourAgo = datefns.subHours(new Date(), 1);
  for (const item of feed.items) {
    const videoTime = new Date(item.pubDate);
    if (videoTime < oneHourAgo) {
      continue;
    }

    const videoTitle = item.title;
    const videoId = item.id.split(":")[2]
    const videoLink = `https://youtu.be/${videoId}`
    const imgUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    console.log(`New video found: ${videoTitle}`);
    try {
      const image = await getBase64(imgUrl);
    } catch(e) {
      error.log(e)
    }
    if (image !== "") {
      const msg = `New video up! ${videoTitle} - ${videoLink}`;
      console.log(`Tweeting: ${msg}`);
      try {
        await tweet(msg, image);
      } catch(e) {
        error.log(e)
      }
    }
  };

}

const tweet = async(text, image) => {
  let media_id = "";

  console.log("Uploading image");
  try {
    const response = await uploadClient.post('media/upload', { media_data: image });
    media_id = response.media_id_string;
  } catch(e) {
    error.log(e)
  }
  
  console.log(`media_id = ${media_id}`)
  if (media_id !== "") {
    try {
    const response = await apiClient.post('statuses/update', { status: text, media_ids: media_id });
    console.log(`Tweeted "${text}"`)
    } catch(e) {
      error.log(e)
    }
  }
}

const main = async() => {
  while (true) {
    try {
      await getVideos();
    } catch(e) {
      error.log(e)
    }
    const sleepTime = 60 * 60;
    console.log(`Sleeping ${sleepTime} seconds...`);
    try {
      await new Promise(resolve => setTimeout(resolve, sleepTime * 1000));
    } catch(e) {
      error.log(e)
    }
  }
}

main();
