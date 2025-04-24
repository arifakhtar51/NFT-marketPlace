import { useEffect, useState } from "react";

const DashboardPage = ({ walletAddress }) => {
  const [myNFTs, setMyNFTs] = useState([]);

  useEffect(() => {
    if (!walletAddress) return;

    const allPurchases = JSON.parse(localStorage.getItem("purchasedPics")) || {};
    const userPurchases = allPurchases[walletAddress.toLowerCase()] || [];

    setMyNFTs(userPurchases);
  }, [walletAddress]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Purchased NFTs</h2>
      {myNFTs.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {myNFTs.map((nft, idx) => (
            <div key={idx} className="border rounded-xl p-2 shadow">
              <img src={nft.src} alt={nft.name} className="w-full h-auto rounded-md" />
              <p className="mt-2 text-center">{nft.name || `NFT #${nft.id}`}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>You haven't purchased any NFTs yet.</p>
      )}
    </div>
  );
};

export default DashboardPage;
