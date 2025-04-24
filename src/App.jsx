import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "./components/Navbar";
import PictureGallery from "./components/PictureGallery";
import ShoppingCart from "./components/ShoppingCart";
import { Toaster, toast } from "react-hot-toast";
import MintNFTPage from "./components/MintNFTPage";
import DashboardPage from "./components/DashboardPage";
import { SUPPORTED_NETWORKS } from "./components/PriceConverter";

export default function App() {
  const [availablePics, setAvailablePics] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [showMintPage, setShowMintPage] = useState(false);
  const [activePage, setActivePage] = useState("gallery");
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_NETWORKS[1]); // Default to Sepolia

  const YOUR_RECEIVER_WALLET = import.meta.env.VITE_RECEIVER_WALLET;
  const TRON_RECEIVER = import.meta.env.VITE_TRON_ADDRESS;

  // Load minted NFTs from localStorage when the component mounts
  useEffect(() => {
    const storedPics = JSON.parse(localStorage.getItem("mintedPics"));
    if (storedPics) {
      const uniquePics = storedPics.filter((pic, index, self) =>
        index === self.findIndex((p) => p.src === pic.src)
      );
      const filtered = uniquePics.filter((pic) => pic.price <= 100);
      localStorage.setItem("mintedPics", JSON.stringify(filtered));
      setAvailablePics(filtered);
    }
  }, []);

  const addToCart = (pic) => {
    if (!cart.find((item) => item.id === pic.id)) {
      setCart([...cart, pic]);
    }
  };

  const handleAddMintedPic = (newPic) => {
    const updatedPics = [...availablePics, newPic];
    setAvailablePics(updatedPics);
    localStorage.setItem("mintedPics", JSON.stringify(updatedPics)); // Save to localStorage
  };

  const removeFromCart = (picId) => {
    setCart(cart.filter((item) => item.id !== picId));
  };

  const FLARE_COSTON2_CHAIN_ID = "0x72"; // Flare Testnet Coston2 chain ID (114)

  const handleWalletToggle = async () => {
    if (walletAddress) {
      setWalletAddress(null);
      toast.success("🔌 Wallet Disconnected");
      return;
    }

    if (!window.ethereum) {
      toast.error("MetaMask is not available.");
      return;
    }

    try {
      // Switching to Amoy
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: FLARE_COSTON2_CHAIN_ID }],
      });
    } catch (switchError) {
      // If not added, try to add Amoy
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: FLARE_COSTON2_CHAIN_ID,
              chainName: "Flare Testnet Coston2",
              rpcUrls: ["https://coston2-api.flare.network/ext/bc/C/rpc"],
              nativeCurrency: {
                name: "Coston2",
                symbol: "C2FLR",
                decimals: 18,
              },
              blockExplorerUrls: ["https://coston2-explorer.flare.network"],
            }],
          });
        } catch (addError) {
          console.error("Failed to add Flare Testnet Coston2:", addError);
          toast.error("Failed to add Flare Testnet Coston2 network.");
          return;
        }
      } else {
        console.error("Failed to switch to Flare Testnet Coston2:", switchError);
        toast.error("Failed to switch network.");
        return;
      }
    }

    // Connect wallet
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      setWalletAddress(address);
      toast.success(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      toast.error("Wallet connection failed.");
    }
  };

  const handleNetworkChange = async (network) => {
    try {
      // Try to switch to the selected network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: network.chainId,
              chainName: network.name,
              rpcUrls: network.rpcUrls,
              nativeCurrency: { 
                name: network.name, 
                symbol: network.symbol, 
                decimals: 18 
              },
              blockExplorerUrls: network.blockExplorerUrls
            }],
          });
        } catch (addError) {
          console.error(`Failed to add ${network.name}:`, addError);
          toast.error(`Failed to add ${network.name} network.`);
          return;
        }
      } else {
        console.error(`Failed to switch to ${network.name}:`, switchError);
        toast.error(`Failed to switch network.`);
        return;
      }
    }
    setSelectedNetwork(network);
  };

  const handlePay = async () => {
    if (!walletAddress) return toast.error("Connect your wallet first.");
    const totalAmount = cart.reduce((acc, item) => acc + item.price, 0);

    try {
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

      // Check if we're on the selected network
      if (currentChainId !== selectedNetwork.chainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: selectedNetwork.chainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: selectedNetwork.chainId,
                chainName: selectedNetwork.name,
                rpcUrls: selectedNetwork.rpcUrls,
                nativeCurrency: { 
                  name: selectedNetwork.name, 
                  symbol: selectedNetwork.symbol, 
                  decimals: 18 
                },
                blockExplorerUrls: selectedNetwork.blockExplorerUrls
              }],
            });
          } else {
            console.error("Network switch failed", switchError);
            toast.error(`Failed to switch to ${selectedNetwork.name}.`);
            return;
          }
        }
      }

      // Ethers.js signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Send payments to individual NFT creators
      for (const item of cart) {
        if (!item.creator) {
          console.warn(`Creator address missing for item: ${item.name}`);
          continue;
        }

        try {
          // Convert price to wei
          const valueInWei = ethers.parseEther(item.price.toString());

          // Create transaction object
          const tx = {
            to: item.creator,
            value: valueInWei,
            gasLimit: 21000
          };

          // Send transaction
          const transaction = await signer.sendTransaction(tx);
          console.log(`Transaction hash: ${transaction.hash}`);

          // Wait for transaction confirmation
          const receipt = await transaction.wait();
          console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        } catch (itemError) {
          console.error(`Error processing item ${item.name}:`, itemError);
          toast.error(`Failed to process payment for ${item.name}`);
          continue;
        }
      }

      // Post-payment cleanup
      const addressKey = walletAddress.toLowerCase();
      const allPurchases = JSON.parse(localStorage.getItem("purchasedPics")) || {};
      const previous = allPurchases[addressKey] || [];
      const updated = [...previous, ...cart];

      const unique = updated.filter(
        (pic, index, self) =>
          index === self.findIndex((p) => p.id === pic.id)
      );

      allPurchases[addressKey] = unique;
      localStorage.setItem("purchasedPics", JSON.stringify(allPurchases));

      setCart([]);
      setShowCart(false);

      toast.success("NFTs Purchased Successfully");
    } catch (err) {
      console.error("handlePay Error:", err);
      toast.error("Transaction Failed: " + (err.message || "Unknown error"));
    }
  };

  const handleMintClick = () => {
    setShowMintPage(true);
    setActivePage("mint");
  };

  const handleDashboardClick = () => {
    setShowMintPage(false);
    setActivePage("dashboard");
  };

  const handleHomeClick = () => {
    setShowMintPage(false);
    setActivePage("gallery");
  };

  const handleBackFromMint = () => {
    setShowMintPage(false);
    setActivePage("gallery");
  };

  return (
    <div className="relative">
      <Toaster position="top-right" />
      <Navbar
        onCartClick={() => setShowCart(true)}
        cartCount={cart.length}
        walletAddress={walletAddress}
        onWalletToggle={handleWalletToggle}
        onMintClick={handleMintClick}
        onDashboardClick={handleDashboardClick}
        onHomeClick={handleHomeClick}
      />
  
      <div className="p-6">
        {showMintPage ? (
          <MintNFTPage
            walletAddress={walletAddress}
            onBack={handleBackFromMint}
            onAddMintedPic={handleAddMintedPic}
          />
        ) : activePage === "dashboard" ? (
          <DashboardPage walletAddress={walletAddress} />
        ) : (
          <PictureGallery 
            pictures={availablePics} 
            addToCart={addToCart}
            onNetworkChange={handleNetworkChange}
          />
        )}
      </div>
  
      <ShoppingCart
        cart={cart}
        handlePay={handlePay}
        showCart={showCart}
        onClose={() => setShowCart(false)}
        removeFromCart={removeFromCart}
        onNetworkChange={handleNetworkChange}
        selectedNetwork={selectedNetwork}
      />
    </div>
  );
}
