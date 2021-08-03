const config = require('./config');
const apiClient = config.newClient();
const uploadClient = config.newClient('upload');
const axios = require('axios').default;

const Parser = require('rss-parser');
const parser = new Parser();

function getBase64(url) {
  return axios
    .get(url, {
      responseType: 'arraybuffer'
    })
    .then(response => Buffer.from(response.data, 'binary').toString('base64'))
}

const getVideos = async() => {
  const feed = await parser.parseURL("https://www.youtube.com/feeds/videos.xml?channel_id=UC9T7-AwG8ECs7AzmVHovQ8A")
  const item = feed.items[0];
  // feed.items.forEach(async item => {
    const videoTitle = item.title;
    const videoId = item.id.split(":")[2]
    const videoLink = `https://youtu.be/${videoId}`
    const imgUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    console.log(imgUrl);
    const image = await getBase64(imgUrl);
    if (image !== "") {
      console.log("Tweeting");
      const msg = `New video up! ${videoTitle} - ${videoLink}`;
      tweet(msg, image);
    }
    process.exit();
  // })
}

const tweet = (text, image) => {
  let media_id = "";
  uploadClient.post('media/upload', { media_data: image })
  .then(media => {
    console.log(media);
    media_id = media.media_id_string;
  }).catch(console.error);

  console.log(`media_id = ${media_id}`)
  if (media_id !== "") {
    apiClient.post('statuses/update', { status: text, media_ids: media_id }).then(result => {
      console.log(`Tweeted "${text}"`)
    }).catch(console.error);
  }
}

getVideos();