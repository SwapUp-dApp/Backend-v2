const { TwitterApi } = require('twitter-api-v2');
function test(req, res) {
  res.send({ network: process.env.NETWORK });
}

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET_KEY,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET
});

async function exchange_code_for_access_token(req, res) {
  const { code, redirectUri } = req.body;

  // console.log({ code, redirectUri });
  try {

    const newTwitterClient = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET
    });

    const { client: loggedClient, accessToken, refreshToken, expiresIn, scope } = await newTwitterClient.loginWithOAuth2({
      code,
      redirectUri,
      codeVerifier: 'challenge',  // Use the same challenge sent during the authorization request
      scopes: ['tweet.read', 'tweet.write', 'tweet.moderate.write', 'users.read', 'offline.access'],
    });

    // You can now store accessToken and refreshToken for future API requests on behalf of the user
    res.json({ accessToken, refreshToken, expiresIn, scope });
  } catch (err) {
    console.error('Error exchanging code for access token:', err);
    res.status(500).json({ error: 'Failed to exchange code for access token' });
  }
}

async function upload_image_to_twitter(req, res) {
  const { image, accessToken } = req.body;

  try {
    const userClient = new TwitterApi(accessToken);
    const loggedClient = userClient.readWrite;

    const imageData = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(imageData, 'base64');

    // Ensure the buffer is not empty and is valid
    if (!buffer || !buffer.length) {
      throw new Error('Invalid image data');
    }

    // Step 1: Upload the image to Twitter
    const mediaId = await twitterClient.v1.uploadMedia(buffer, { mimeType: 'image/png' });

    // Step 2: Use the media ID to create a tweet with the uploaded image
    const tweetResponse = await loggedClient.v2.tweet({
      text: 'Here is an image!',
      media: {
        media_ids: [mediaId], // Use the uploaded media ID here
      },
    });

    res.json({ tweetResponse });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `***upload_image_to_twitter error -> ${err}`
    });
  }
}

export const twitterController = {
  test,
  upload_image_to_twitter,
  exchange_code_for_access_token
};
