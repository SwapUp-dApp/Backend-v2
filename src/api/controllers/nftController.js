import { getAlchemy } from "../../utils/alchemy.js";
//import { testDb } from "../models/test.js";

function test(req, res) {
    //testDb();
    res.send({ network: process.env.NETWORK });
    let alchemy = getAlchemy();
    //alchemy.core.resolveName("xyz.3dot0.eth").then(console.log);
    console.log(alchemy);
}

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
        console.log(nfts);
        res.send(nfts);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: `***list_all_wallet_nfts error -> ${err}`
        });
    }
}

async function list_all_wallet_collection(req, res) {
    try {
        let alchemy = getAlchemy();

        let allNftsOwned = [];
        let nftCollections = {};
        let collectionsResponse = [];

        const nftsIterable = alchemy.nft.getNftsForOwnerIterator(req.params.walletId);

        for await (const nft of nftsIterable) {
            allNftsOwned.push(nft);
        }

        // Iterate over the NFTs array
        allNftsOwned.forEach((nft) => {
            // Get the contract address of the current NFT
            const contractAddress = nft.contract.address;

            // Check if this address already exists in the nftCollections object
            if (!nftCollections[contractAddress]) {
                // If not, initialize an empty array for this address
                nftCollections[contractAddress] = [];
            }

            // Push the current NFT into the corresponding array
            nftCollections[contractAddress].push(nft);
        });

        Object.keys(nftCollections).forEach((collection, index) => {
            const firstNftOfCurrentCollections = nftCollections[collection][0];
            const currentAllCollections = nftCollections[collection];

            const collectionResponseFormate = {
                id: firstNftOfCurrentCollections.contract.address,
                cover: firstNftOfCurrentCollections.media[0].gateway || '',
                collectionName: firstNftOfCurrentCollections.contract.name,
                totalAssets: Number(firstNftOfCurrentCollections.contract.totalSupply),
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
        console.log(err);
        res.status(500).json({
            success: false,
            message: `***list_all_wallet_collections error -> ${err}`
        });
    }
}

///register a new wallet account in the system
async function register_a_wallet(req, res) {
    //
}

export const nftController = {
    test,
    list_all_wallet_nfts,
    register_a_wallet,
    list_all_wallet_collection
};
