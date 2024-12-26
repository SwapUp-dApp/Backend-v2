import Environment from "../../config/index.js";
import { getAlchemy } from "../../utils/alchemy.js";
import { handleError } from "../../errors";
import logger from "../../logger/index.js";
import { getNFTCollectionsByWalletId } from "../utils/nft.js";

// returns all the nfts owned by a wallet address
async function list_all_wallet_nfts(req, res) {
    try {
        let alchemy = getAlchemy();
        // Print all NFTs returned in the response:
        let nfts = [];
        // Get the async iterable for the owner's NFTs.
        const nftsIterable = alchemy.nft.getNftsForOwnerIterator(req.params.walletId);

        // Iterate over the NFTs and add them to the nfts array.
        for await (const nft of nftsIterable) {
            nfts.push(nft);
        }
        //let nfts = await alchemy.nft.getNftsForOwner(req.params.walletId)
        logger.info(nfts);
        res.send(nfts);
    } catch (err) {
        handleError(res, err, "***list_all_wallet_nfts error");
    }
}

async function list_all_wallet_collection(req, res) {
    try {
        const walletId = req.params.walletId;
        let collectionsResponse = [];

        const { allNftsOwned, nftCollections } = await getNFTCollectionsByWalletId(walletId);

        Object.keys(nftCollections).forEach((collection, index) => {
            const firstNftOfCurrentCollections = nftCollections[collection][0];
            const currentAllCollections = nftCollections[collection];

            const collectionResponseFormate = {
                id: firstNftOfCurrentCollections.contract.address,
                cover: firstNftOfCurrentCollections.media.length > 0 ? firstNftOfCurrentCollections.media[0].gateway || '' : '',
                collectionName: firstNftOfCurrentCollections.contract.name,
                ownedAssets: currentAllCollections.length,
                floorPrice: 0,
                highestRankNft: 0,
                openApproval: (index % 2) ? false : true,
                volume: 0
            };

            collectionsResponse.push(collectionResponseFormate);
        });

        // Now nftCollections contains NFTs grouped by their collection address
        res.send(collectionsResponse);

    } catch (err) {
        handleError(res, err, "***list_all_wallet_collections error");
    }
}


export const nftController = {
    list_all_wallet_nfts,
    list_all_wallet_collection
};
