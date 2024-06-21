import { getAlchemy } from "../../utils/alchemy.js"
//import { testDb } from "../models/test.js";

function test(req, res) {
    //testDb();
    res.send({ network: process.env.NETWORK })
    let alchemy = getAlchemy()
    //alchemy.core.resolveName("xyz.3dot0.eth").then(console.log);
    console.log(alchemy);
}

// returns all the nfts owned by a wallet address
async function list_all_wallet_nfts(req, res) {
    try {
        let alchemy = getAlchemy()
        // Print all NFTs returned in the response:
        let nfts = [];
        // Get the async iterable for the owner's NFTs.
        const nftsIterable = alchemy.nft.getNftsForOwnerIterator(req.params.walletId);

        // Iterate over the NFTs and add them to the nfts array.
        for await (const nft of nftsIterable) {
            nfts.push(nft);
        }
        //let nfts = await alchemy.nft.getNftsForOwner(req.params.walletId)
        console.log(nfts)
        res.send(nfts)
    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: `***list_all_wallet_nfts error -> ${err}`
        })
    }
}

///register a new wallet account in the system
async function register_a_wallet(req, res) {
    //
}

export const nftController = {
    test,
    list_all_wallet_nfts,
    register_a_wallet
}
