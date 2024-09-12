import db from '../../database/models';
import { tryParseJSON } from '../utils/helpers';

const { TwitterApi } = require('twitter-api-v2');
const puppeteer = require('puppeteer');

const swapUpTwitterClient = new TwitterApi({
   appKey: process.env.TWITTER_API_KEY,
   appSecret: process.env.TWITTER_API_SECRET_KEY,
   accessToken: process.env.TWITTER_ACCESS_TOKEN,
   accessSecret: process.env.TWITTER_ACCESS_SECRET,
   clientId: process.env.TWITTER_CLIENT_ID,
   clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

async function test_image_creation_and_deletion(req, res) {

   const {
      walletAddress
   } = req.body;

   const imageProps = {
      "tradeId": "bbf646",
      "initTokens": [
         {
            "id": "0x69A80fc0AEEADAb709ac0e939E94d195D98579eb",
            "address": "0x69A80fc0AEEADAb709ac0e939E94d195D98579eb",
            "type": "ERC20",
            "image_url": "https://www.swapup.io/assets/images/swapip-logo-black.png",
            "value": {
               "amount": 100,
               "usdAmount": 200,
               "symbol": "SWP"
            }
         },
         {
            "id": "1",
            "address": "0xead705ebc963f5b8367b99a85638dc1619ca8215",
            "type": "ERC721",
            "image_url": "https://nft-cdn.alchemy.com/base-sepolia/bc3dc795af7d44294a2cab3d40280e00"
         },
         {
            "id": "3",
            "address": "0xc96939c0e48b3d1a4061263fc57cce7e2d071feb",
            "type": "ERC721",
            "image_url": "https://nft-cdn.alchemy.com/base-sepolia/12c5c4f731b42565073d9785b77e8f3c"
         },
         {
            "id": "4",
            "address": "0xead705ebc963f5b8367b99a85638dc1619ca8215",
            "type": "ERC721",
            "image_url": "https://nft-cdn.alchemy.com/base-sepolia/bc3dc795af7d44294a2cab3d40280e00"
         },
         {
            "id": "5",
            "address": "0xc96939c0e48b3d1a4061263fc57cce7e2d071feb",
            "type": "ERC721",
            "image_url": "https://nft-cdn.alchemy.com/base-sepolia/12c5c4f731b42565073d9785b77e8f3c"
         },
         {
            "id": "6",
            "address": "0xc96939c0e48b3d1a4061263fc57cce7e2d071feb",
            "type": "ERC721",
            "image_url": "https://nft-cdn.alchemy.com/base-sepolia/12c5c4f731b42565073d9785b77e8f3c"
         },
      ],
      "acceptTokens": [
         {
            "id": "0x69A80fc0AEEADAb709ac0e939E94d195D98579eb",
            "address": "0x69A80fc0AEEADAb709ac0e939E94d195D98579eb",
            "type": "ERC20",
            "image_url": "https://www.swapup.io/assets/images/swapip-logo-black.png",
            "value": {
               "amount": 100,
               "usdAmount": 200,
               "symbol": "SWP"
            }
         }
      ],
      "title": "I am trading"
   };


   try {
      let htmlString = getSwapImageHTMLStringByImageProps(imageProps);

      const buffer = await getBufferFromHTMLString(htmlString);

      const mediaId = await swapUpTwitterClient.v1.uploadMedia(buffer, { mimeType: 'image/png' });

      const tweetResponse = await swapUpTwitterClient.v2.tweet({
         text: "Test post",
         media: {
            media_ids: [mediaId], // Use the uploaded media ID here
         },
      });

      res.status(201).json(tweetResponse);
   } catch (err) {
      console.log(err);
      res.status(500).json({
         success: false,
         message: `***test_image_creation_and_deletion error -> ${err}`
      });
   }
}

async function exchange_code_for_access_token(req, res) {
   const { code, redirectUri, walletAddress } = req.body;

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

      // creating user client from accessToken
      const userClient = new TwitterApi(accessToken);
      const loggedUserClient = userClient.readWrite;

      // Fetch the authenticated user's account information
      const userInfo = await loggedUserClient.v2.me();

      const createdAt = Date.now();
      const accessResponseObject = { accessToken, refreshToken, expiresIn, scope, createdAt, userInfo: userInfo.data };

      const updatedUser = await db.users.update(
         {
            twitter_access: JSON.stringify(accessResponseObject),
         },
         { where: { wallet: walletAddress } }
      );

      if (accessResponseObject && updatedUser) {
         res.status(201).json({
            success: true,
            message: "User twitter access saved.",
            updatedUser: updatedUser,
            twitterAccess: accessResponseObject
         });
      }
   } catch (err) {
      console.error('Error exchanging code for access token:', err);
      res.status(500).json({ error: 'Failed to exchange code for access token' });
   }
}

async function upload_image_to_twitter(req, res) {

   const {
      imageProps,
      mentions,
      appLink,
      hashtags,
      postTitle,
      postDescription,
      walletAddress
   } = req.body;


   try {
      const htmlString = getSwapImageHTMLStringByImageProps(imageProps);

      const user = await db.users.findOne({
         where: { wallet: walletAddress },
      });

      const getFormattedTwitterAccessOfUser = () => {
         const userJSON = user.toJSON();

         let formattedSwap = {
            ...tryParseJSON(userJSON.twitter_access),
         };

         return formattedSwap;
      };

      const { accessToken, refreshToken, createdAt } = getFormattedTwitterAccessOfUser();

      let userClient;

      // Refresh the token if it has expired or is about to expire
      if (isTokenExpired(createdAt)) {
         const refreshedClient = await get_refreshed_twitter_client(refreshToken);
         userClient = refreshedClient;
      } else {
         userClient = new TwitterApi(accessToken);
      }

      const loggedClient = userClient.readWrite;

      const buffer = await getBufferFromHTMLString(htmlString);
      console.log("Buffer: ", buffer);

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

     ${appLink ? "Here is the SwapUp link 👇🏻 \n" + appLink : ''}

     ${mentionString}
     ${hashtagString}
     `.trim();

      // Upload the image to Twitter using SwapUp twitter client
      const mediaId = await loggedClient.v1.uploadMedia(buffer, { mimeType: 'image/jpeg', chunked: true });

      console.log("Media Id: ", mediaId);

      const tweetData = {
         text: postContent,
         media: {
            media_ids: [mediaId]
         }
      };

      const tweetResponse = await loggedClient.v2.tweet(tweetData);


      // const tweetResponse = await loggedClient.v2.tweetThread([
      //    'Hello, lets talk about Twitter!',
      //    { text: 'Twitter is a fantastic social network. Look at this:', media: { media_ids: [mediaId] } },
      //    'This thread is automatically made with twitter-api-v2 :D',
      // ]);

      res.status(201).json(tweetResponse);
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
      throw new Error('Failed to refresh access token');
   }
}

// Helper functions for twitter controller starts here

const isTokenExpired = (createdAt) => {
   const expiresIn = 7200; // 2 hours in seconds
   const expirationTime = createdAt + expiresIn * 1000;
   return Date.now() >= expirationTime;
};

const getSwapImageHTMLStringByImageProps = (imageProps) => {
   const {
      tradeId,
      title,
      initTokens,
      acceptTokens
   } = imageProps;

   let htmlString =
      `
      <!DOCTYPE html>
         <html lang="en">
         
         <head>
         <meta charset="UTF-8">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <title>Simple Tailwind Design with Custom Fonts</title>
         </head>
         
         <body
         style="display: flex; flex-direction: column; gap: 1rem; background-color: rgba(13, 13, 35, 1); color: white; font-size: 16px; padding: 1rem; margin: 0;"
         >
         
         <main>
            <!-- Header -->
            <header style="display: flex; justify-content: space-between; align-items: center;">
         
               <img src="https://www.swapup.io/swapup.png" alt="SwapUp" style="width: 6rem;">
               <span style="font-weight: 500;">
               Trade ID: <span>{{tradeId}}</span>
               </span>
            </header>
         
            <section style="padding: 0 1.5rem; display: flex; flex-direction: column; gap: .75rem;">
               <p>{{imageTitle}}</p>
         
               <!-- Sender side -->
               <aside style="display: flex; justify-content: center; gap: 1rem; margin-top: 0.75rem;" id="sender-container">
               {{sender-swap-content}}
               </aside>
         
               <!-- Share Icon -->
               <span style="display: flex; justify-content: center;">
               <svg style="width: 3rem; height: 1.5rem; rotate: 90deg;" viewBox="0 0 30 32" fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="30" height="30" rx="15" stroke="url(#paint0_linear_2344_40905)" stroke-width="2" />
                  <path
                     d="M17.7284 11L22 15.1586H10.2385V14.0368H19.2184L16.9138 11.7931L17.7284 11ZM21.7615 16.8414V17.9632H12.7816L15.0862 20.2069L14.2716 21L10 16.8414H21.7615Z"
                     fill="white" />
                  <defs>
                     <linearGradient id="paint0_linear_2344_40905" x1="32" y1="6.08" x2="-1.86631" y2="14.9716"
                     gradientUnits="userSpaceOnUse">
                     <stop stop-color="#51C0FF" />
                     <stop offset="1" stop-color="#9452FF" />
                     </linearGradient>
                  </defs>
               </svg>
               </span>
         
               <!-- Receiver side -->
               <aside style="display: flex; justify-content: center; gap: 1rem; margin-top: 0.75rem;" id="receiver-container">
               {{receiver-swap-content}}
               </aside>
            </section>
         </main>
         </body>
      
      </html>
      `;

   const senderSideSwapContent = getSwapHTMLContentBySwapTokens(initTokens, 4);
   const receiverSideSwapContent = getSwapHTMLContentBySwapTokens(acceptTokens ? acceptTokens : [], 4);

   htmlString = htmlString
      .replace("{{sender-swap-content}}", senderSideSwapContent)
      .replace("{{receiver-swap-content}}", receiverSideSwapContent)
      .replace("{{imageTitle}}", title)
      .replace("{{tradeId}}", tradeId);


   return htmlString;
};

const getSwapHTMLContentBySwapTokens = (swapTokens, maxSwapTokenToShow) => {
   const nftCardDesign =
      `
      <div style="font-size: 0.8rem;">
         <div style="width: 6rem; height: 7rem; position: relative;">
            <img
               style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem; border: rgba(255, 255, 255, 0.2)"
               src="{{nftImageSrc}}" alt="nft" />
               {{remainingOverlay}}
         </div>
         <p style="margin-top: 0.25rem;">ID# {{nftId}}</p>
      </div>
      `;

   const currencyTokenCardDesign =
      `       
      <div style="font-size: 0.8rem;">
         <div style="width: 5rem; height: 5rem;">
            <img style="width: 100%; height: 100%; object-fit: cover;" src="{{currencyTokenIconUrl}}" alt="nft" />
         </div>
         <p style="margin-top: 0.25rem; font-size: 0.7rem;">Price: {{currencyAmount}}</p>
         <p style="font-size: 0.7rem;">USD: {{currencyUsdAmount}}</p>
      </div>
      `;

   let sectionContent = '';

   if (swapTokens.length === 0) {
      return "Waiting for proposals!";
   }

   swapTokens.forEach((swapToken, index) => {
      // Skip tokens beyond maxSwapTokenToShow
      if (index >= maxSwapTokenToShow) return;

      let newSwapTokenCard = (swapToken.type === 'ERC20') ? currencyTokenCardDesign : nftCardDesign;

      // Add overlay with the remaining count if this is the last card and there are more tokens left
      if (index === maxSwapTokenToShow - 1 && swapTokens.length > maxSwapTokenToShow) {
         const remainingCount = swapTokens.length - maxSwapTokenToShow;
         const remainingOverlay = `
            <div
               style="position: absolute; width: 100%; height: 100%; border-radius: 0.5rem; background-color: rgba(0,0,0,.7); top: 0; left: 0; z-index: 50; display: flex; justify-content: center; align-items: center; font-weight: 600; font-size: 1rem; color: white;">
               + ${remainingCount}
            </div>`;
         newSwapTokenCard = newSwapTokenCard.replace("{{remainingOverlay}}", remainingOverlay);
      } else {
         newSwapTokenCard = newSwapTokenCard.replace("{{remainingOverlay}}", ""); // No overlay
      }

      // Regular card processing
      if (swapToken.type === 'ERC20') {
         const amount = `${swapToken.value.amount} ${swapToken.value.symbol}`;
         const usdAmount = `${swapToken.value.usdAmount.toFixed(5)} $`;

         newSwapTokenCard = newSwapTokenCard
            .replace("{{currencyTokenIconUrl}}", swapToken.image_url)
            .replace("{{currencyAmount}}", amount)
            .replace("{{currencyUsdAmount}}", usdAmount);
      } else {
         newSwapTokenCard = newSwapTokenCard
            .replace("{{nftImageSrc}}", swapToken.image_url)
            .replace("{{nftId}}", swapToken.id);
      }

      sectionContent += newSwapTokenCard;
   });

   return sectionContent;
};


const getBufferFromHTMLString = async (htmlString) => {
   try {

      const browser = await puppeteer.launch({
         args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });


      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });

      await page.setContent(htmlString, {
         waitUntil: 'domcontentloaded' // Ensure the DOM is fully loaded
      });

      // Add extra wait time for all resources (like fonts, images) to load
      await new Promise(resolve => setTimeout(resolve, 10000));

      // const pageContent = await page.content();
      // console.log("Content: ==> ", pageContent);

      // Capture a screenshot of the entire page
      const buffer = await page.screenshot({
         type: 'jpeg',
         // fullPage: true,
         quality: 10
      });

      await browser.close();

      // Log the buffer size
      console.log("Buffer Size:", Buffer.byteLength(buffer), "bytes");

      return Buffer.from(buffer);
   } catch (error) {
      throw error;
   }

};

export const twitterController = {
   upload_image_to_twitter,
   exchange_code_for_access_token,
   test_image_creation_and_deletion
};
