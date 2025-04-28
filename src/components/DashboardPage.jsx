import { useEffect, useState } from "react";
import { SUPPORTED_NETWORKS } from "./PriceConverter";

const DashboardPage = ({ walletAddress }) => {
  const [myNFTs, setMyNFTs] = useState([]);

  useEffect(() => {
    if (!walletAddress) return;

    const allPurchasedNFTs = JSON.parse(localStorage.getItem("purchasedNFTs")) || {};
    const userPurchasedNFTs = allPurchasedNFTs[walletAddress.toLowerCase()] || [];

    setMyNFTs(userPurchasedNFTs);
  }, [walletAddress]);

  const getNetworkName = (chainId) => {
    const network = Object.values(SUPPORTED_NETWORKS).find(
      net => net.chainId === chainId
    );
    return network ? network.name : `Network ${chainId}`;
  };

  const getNetworkSymbol = (chainId) => {
    const network = Object.values(SUPPORTED_NETWORKS).find(
      net => net.chainId === chainId
    );
    return network ? network.symbol : 'ETH';
  };

  const getBlockExplorerUrl = (chainId, txHash) => {
    // Default to Etherscan
    let baseUrl = 'https://etherscan.io';
    
    // Check networks
    if (chainId === '0xaa36a7') {
      baseUrl = 'https://sepolia.etherscan.io';
    } else if (chainId === '0x89') {
      baseUrl = 'https://polygonscan.com';
    } else if (chainId === '0x44d' || chainId === '0x14a34') {
      baseUrl = 'https://zkevm.polygonscan.com';
    } else if (chainId === '0x13881' || chainId === '0x13882') {
      baseUrl = 'https://mumbai.polygonscan.com';
    } else if (chainId === '0x38') {
      baseUrl = 'https://bscscan.com';
    } else if (chainId === '0xa86a') {
      baseUrl = 'https://snowtrace.io';
    } else if (chainId === '0xa') {
      baseUrl = 'https://optimistic.etherscan.io';
    } else if (chainId === '0xa4b1') {
      baseUrl = 'https://arbiscan.io';
    } else if (chainId === '0x72') {
      baseUrl = 'https://coston2-explorer.flare.network';
    } else if (chainId === '0x8a3') {
      baseUrl = 'https://amoy.etherscan.io';
    }
    
    return `${baseUrl}/tx/${txHash}`;
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Your Purchased NFTs</h2>
      {myNFTs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {myNFTs.map((nft, idx) => (
            <div key={idx} className="border rounded-xl p-4 shadow hover:shadow-lg transition-shadow">
              <img 
                src={nft.src} 
                alt={nft.name} 
                className="w-full h-48 object-cover rounded-md mb-2" 
              />
              <div className="p-2">
                <p className="font-semibold text-lg">{nft.name || `NFT #${nft.id}`}</p>
                <p className="text-sm text-gray-600">
                  Price: {nft.price} {getNetworkSymbol(nft.network)}
                </p>
                <p className="text-sm text-gray-600">
                  Network: {getNetworkName(nft.network)}
                </p>
                <p className="text-xs text-gray-500">
                  Purchased: {new Date(nft.purchaseDate).toLocaleDateString()}
                </p>
                <a 
                  href={getBlockExplorerUrl(nft.network, nft.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  View Transaction
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">You haven't purchased any NFTs yet.</p>
      )}
    </div>
  );
};

export default DashboardPage;
