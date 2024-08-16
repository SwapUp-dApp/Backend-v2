const { TwitterApi } = require('twitter-api-v2');
function test(req, res) {
  res.send({ network: process.env.NETWORK });
}

const swapUpTwitterClient = new TwitterApi({
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
    const createdAt = Date.now();
    res.json({ accessToken, refreshToken, expiresIn, scope, createdAt });
  } catch (err) {
    console.error('Error exchanging code for access token:', err);
    res.status(500).json({ error: 'Failed to exchange code for access token' });
  }
}

async function upload_image_to_twitter(req, res) {

  const {
    image,
    accessToken,
    refreshToken,
    createdAt,
    mentions,
    appLink,
    hashtags,
    postTitle,
    postDescription
  } = req.body;

  try {
    let userClient;

    // Refresh the token if it has expired or is about to expire
    if (isTokenExpired(createdAt)) {
      const refreshedClient = await get_refreshed_twitter_client(refreshToken);
      userClient = refreshedClient;
    } else {
      userClient = new TwitterApi(accessToken);
    }

    const loggedClient = userClient.readWrite;

    const imageData = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(imageData, 'base64');

    // Ensure the buffer is not empty and is valid
    if (!buffer || !buffer.length) {
      throw new Error('Invalid image data');
    }

    // Format mentions, app link, and hashtags
    const mentionString = mentions?.map(mention => `@${mention}`).join(' ') || '';
    const hashtagString = hashtags?.map(hashtag => `#${hashtag}`).join(' ') || '';

    const postContent = `
    ${postTitle}

    ${postDescription}

    ${appLink ? "Checkout SwapUp \n" + appLink : ''}

    ${mentionString}
    ${hashtagString}
    `.trim();

    // Step 1: Upload the image to Twitter using SwapUp twitter client
    const mediaId = await swapUpTwitterClient.v1.uploadMedia(buffer, { mimeType: 'image/png' });

    // Step 2: Use the media ID to create a tweet with the uploaded image
    const tweetResponse = await loggedClient.v2.tweet({
      text: postContent,
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

// Helper functions
async function get_refreshed_twitter_client(refreshToken) {

  try {
    const newTwitterClient = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET
    });

    const { client: refreshedClient } = await newTwitterClient.refreshOAuth2Token(refreshToken);

    return refreshedClient;

  } catch (err) {
    console.error('Error while refreshing token:', err);
    res.status(500).json({ error: 'Failed to refresh access token' });
  }
}
const isTokenExpired = (createdAt) => {
  const expiresIn = 7200; // 2 hours in seconds
  const expirationTime = createdAt + expiresIn * 1000;
  return Date.now() >= expirationTime;
};


export const twitterController = {
  test,
  upload_image_to_twitter,
  exchange_code_for_access_token
};
