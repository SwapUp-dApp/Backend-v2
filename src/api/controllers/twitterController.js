const nodeHtmlToImage = require('node-html-to-image');

import db from '../../database/models';
import { deleteFile, getBuffer, tryParseJSON } from '../utils/helpers';

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
         const swapJSON = user.toJSON();

         let formattedSwap = {
            ...tryParseJSON(swapJSON.twitter_access),
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

      // Creating unique image name using user wallet address
      const localSavedTwitterImageName = `twitterImage-${walletAddress}.png`;

      // Creating image using htmlString & image name
      await nodeHtmlToImage({
         output: `./pictures/${localSavedTwitterImageName}`,
         html: htmlString,
      });

      const buffer = await getBuffer(localSavedTwitterImageName);

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
      const mediaId = await swapUpTwitterClient.v1.uploadMedia(buffer, { mimeType: 'image/png' });

      if (mediaId) {
         // Deleting the local saved image
         await deleteFile(localSavedTwitterImageName);
      }

      // Use the media ID to create a tweet with the uploaded image
      const tweetResponse = await loggedClient.v2.tweet({
         text: postContent,
         media: {
            media_ids: [mediaId], // Use the uploaded media ID here
         },
      });

      res.status(201).json(tweetResponse);
   } catch (err) {
      console.log(err);
      res.status(500).json({
         success: false,
         message: `***upload_image_to_twitter error -> ${err}`
      });
   }
}


async function test_image_creation_and_deletion(req, res) {

   const {
      walletAddress
   } = req.body;

   let htmlString = getSwapImageHTMLStringByImageProps();

   try {
      //   Creating unique image name using user wallet address
      const localSavedTwitterImageName = `twitterImage-${walletAddress}.png`;

      // Creating image using htmlString & image name
      await nodeHtmlToImage({
         output: `./pictures/${localSavedTwitterImageName}`,
         html: htmlString,
      });

      const buffer = await getBuffer(localSavedTwitterImageName);

      // Ensure the buffer is not empty and is valid
      if (!buffer || !buffer.length) {
         throw new Error('Invalid image data');
      }

      await deleteFile(localSavedTwitterImageName);
      // console.log("Test Image deleted...");

      res.status(201).json(buffer);
   } catch (err) {
      console.log(err);
      res.status(500).json({
         success: false,
         message: `***test_image_creation_and_deletion error -> ${err}`
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
   
     <!-- Google Fonts -->
     <link rel="preconnect" href="https://fonts.googleapis.com">
     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
     <link
       href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap"
       rel="stylesheet">
   
     <!-- Tailwind CSS -->
     <script src="https://cdn.tailwindcss.com"></script>
   
     <!-- Custom Styles -->
     <style>
       body {
         font-family: 'Poppins', sans-serif;
         background-color: rgba(13, 13, 35, 1);
         color: white;
         font-size: 16px;
         padding: 1rem;
       }
     </style>
   </head>
   
   <body>
   
     <main class="flex flex-col gap-4">
       <!-- Header -->
       <header class="flex items-center justify-between">
       
       <svg width="66" height="28" viewBox="0 0 66 28" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
       <rect y="0.666626" width="66" height="26.6667" fill="url(#pattern0_3268_2677)"/>
       <defs>
       <pattern id="pattern0_3268_2677" patternContentUnits="objectBoundingBox" width="1" height="1">
       <use xlink:href="#image0_3268_2677" transform="matrix(0.0014618 0 0 0.00361794 0 -0.00108538)"/>
       </pattern>
       <image id="image0_3268_2677" width="691" height="277" xlink:href="data:image/png;base64,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"/>
       </defs>
       </svg>
       
   
         <span class="font-semibold">
           Trade ID: <span class="font-normal">{{tradeId}}</span>
         </span>
       </header>
   
       <section class="px-6 flex flex-col gap-3">
         <p>{{imageTitle}}</p>
   
         <!-- Sender side -->
         <aside class="flex justify-center items-center gap-3 mt-4" id="sender-container">
           {{sender-swap-content}}
         </aside>
   
         <!-- Share Icon -->
         <svg class="w-12 h-6 rotate-90 mx-auto" viewBox="0 0 30 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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
   
         <!-- Receiver side -->
         <aside class="flex justify-center items-center gap-3 mt-4" id="receiver-container">
         {{receiver-swap-content}}
         </aside>
       </section>
     </main>
   </body>
      </html>
      `;

   const senderSideSwapContent = getSwapHTMLContentBySwapTokens(initTokens, 4);
   const receiverSideSwapContent = getSwapHTMLContentBySwapTokens(acceptTokens, 4);

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
         <div class="text-sm" >
             <div class="relative w-24 h-28">
               <img class="w-full h-full object-cover rounded-[8px] border-[1.5px] border-white/20" 
               src="{{nftImageSrc}}"
                 alt="nft" />
   
               <!-- <div
                 class="absolute w-full h-full rounded-[8px] bg-black/50 top-0 flex justify-center items-center font-semibold text-base">
                 + {{remainingLength}}
               </div> -->
             </div>
   
             <p class="mt-1"> ID# {{nftId}}</p>
           </div >
         `;

   const currencyTokenCardDesign =
      `       
         <div class="text-sm" >
             <div class="relative w-20 h-20">
               <img class="w-full h-full object-cover" 
               src="{{currencyTokenIconUrl}}"
                 alt="nft" />
             </div>
   
             <p class="mt-1 text-xs"> Price: {{currencyAmount}}</p>
             <p class="text-xs"> USD: {{currencyUsdAmount}}</p>
           </div >
         `;

   let senderSideContent = '';

   swapTokens.forEach((swapToken, index) => {
      let newNftCard = (swapToken.type === 'ERC20') ? currencyTokenCardDesign : nftCardDesign;

      if (swapToken.type === 'ERC20') {
         const amount = `${swapToken.value.amount} ${swapToken.value.symbol}`;
         const usdAmount = `${swapToken.value.usdAmount.toFixed(5)} $`;

         newNftCard = newNftCard
            .replace("{{currencyTokenIconUrl}}", swapToken.image_url)
            .replace("{{currencyAmount}}", amount)
            .replace("{{currencyUsdAmount}}", usdAmount);
      }

      if (swapToken.type !== 'ERC20') {
         newNftCard = newNftCard
            .replace("{{nftImageSrc}}", swapToken.image_url)
            .replace("{{nftId}}", swapToken.id);

         if (index === maxSwapTokenToShow) {
            newNftCard = newNftCard
               .replace("<!--", "")
               .replace("-->", "")
               .replace("{{remainingLength}}", swapTokens.length - maxSwapTokenToShow);
            senderSideContent = senderSideContent + newNftCard;
            return;
         }
      }

      senderSideContent = senderSideContent + newNftCard;
   });

   return senderSideContent;
};



export const twitterController = {
   test,
   upload_image_to_twitter,
   exchange_code_for_access_token,
   test_image_creation_and_deletion
};
