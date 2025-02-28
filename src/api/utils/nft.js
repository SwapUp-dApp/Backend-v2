import { getAlchemy } from "../../utils/alchemy";

export const getNFTCollectionsByWalletId = async (walletId) => {
  let alchemy = getAlchemy();

  let allNftsOwned = [];
  let nftCollections = {};

  const nftsIterable = alchemy.nft.getNftsForOwnerIterator(walletId);

  for await (const nft of nftsIterable) {
    if (!(nft.title.endsWith(".eth") || (nft.contract.name.endsWith(".eth")))) {
      allNftsOwned.push(nft);
    }
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


  return { allNftsOwned, nftCollections };
};