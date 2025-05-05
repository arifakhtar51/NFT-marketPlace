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
  const [selectedNetwork, setSelectedNetwork] = useState({
    name: 'Flare Testnet Coston2',
    symbol: 'C2FLR',
    chainId: '0x72',
    rpcUrls: ['https://coston2-api.flare.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://coston2-explorer.flare.network']
  }); // Initialize with Flare network

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
      
      // Get all purchased NFTs across all users
      const allPurchasedNFTs = JSON.parse(localStorage.getItem("purchasedNFTs")) || {};
      const allPurchasedNFTIds = new Set();
      
      // Collect all purchased NFT IDs
      Object.values(allPurchasedNFTs).forEach(userNFTs => {
        userNFTs.forEach(nft => {
          allPurchasedNFTIds.add(nft.id);
        });
      });
      
      // Filter out any NFTs that have been purchased
      const availableNFTs = filtered.filter(pic => !allPurchasedNFTIds.has(pic.id));
      
      localStorage.setItem("mintedPics", JSON.stringify(availableNFTs));
      setAvailablePics(availableNFTs);
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
      // Connect wallet first
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      setWalletAddress(address);
      toast.success(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);

      // Get current network after connection
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const currentChainId = `0x${network.chainId.toString(16)}`;

      // Set the current network as selected
      const currentNetwork = Object.values(SUPPORTED_NETWORKS).find(
        net => net.chainId === currentChainId
      );
      if (currentNetwork) {
        setSelectedNetwork(currentNetwork);
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
      toast.error("Wallet connection failed.");
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setWalletAddress(null);
          toast.success("🔌 Wallet Disconnected");
        } else {
          setWalletAddress(accounts[0]);
          toast.success(`Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
        }
      };

      const handleChainChanged = async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          const currentChainId = `0x${network.chainId.toString(16)}`;
          
          const currentNetwork = Object.values(SUPPORTED_NETWORKS).find(
            net => net.chainId === currentChainId
          );
          if (currentNetwork) {
            setSelectedNetwork(currentNetwork);
          }
        } catch (err) {
          console.error("Error handling chain change:", err);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Initialize network on component mount
  useEffect(() => {
    const initializeNetwork = async () => {
      if (!window.ethereum) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const currentChainId = `0x${network.chainId.toString(16)}`;
        
        // Find matching network from SUPPORTED_NETWORKS
        const currentNetwork = Object.values(SUPPORTED_NETWORKS).find(
          net => net.chainId === currentChainId
        );
        
        if (currentNetwork) {
          setSelectedNetwork(currentNetwork);
        }
      } catch (err) {
        console.error("Error initializing network:", err);
      }
    };

    initializeNetwork();
  }, []);

  const handleNetworkChange = async (network) => {
    if (!network || !network.chainId) {
      toast.error("Invalid network configuration");
      return;
    }

    try {
      // Try to switch to the selected network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });

      // Update selected network after successful switch
      setSelectedNetwork(network);
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
          
          // Update selected network after successful addition
          setSelectedNetwork(network);
        } catch (addError) {
          console.error(`Failed to add ${network.name}:`, addError);
          toast.error(`Failed to add ${network.name} network.`);
        }
      } else {
        console.error(`Failed to switch to ${network.name}:`, switchError);
        toast.error(`Failed to switch network.`);
      }
    }
  };

  const handlePay = async () => {
    if (!walletAddress) {
      toast.error("Connect your wallet first.");
      return;
    }

    if (!window.ethereum) {
      toast.error("MetaMask is not available.");
      return;
    }

    const totalAmount = cart.reduce((acc, item) => acc + item.price, 0);

    try {
      // Get current network
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (!network || !network.chainId) {
        toast.error("Unable to detect current network");
        return;
      }

      const currentChainId = `0x${network.chainId.toString(16)}`;

      // Get signer for current network
      const signer = await provider.getSigner();

      // Process all transactions in sequence
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

          // Save transaction details to localStorage for dashboard
          const transactionDetails = {
            hash: transaction.hash,
            network: currentChainId,
            item: item,
            timestamp: new Date().toISOString()
          };

          const addressKey = walletAddress.toLowerCase();
          
          // Save transaction
          const allTransactions = JSON.parse(localStorage.getItem("transactions")) || {};
          const userTransactions = allTransactions[addressKey] || [];
          userTransactions.push(transactionDetails);
          allTransactions[addressKey] = userTransactions;
          localStorage.setItem("transactions", JSON.stringify(allTransactions));

          // Save purchased NFT
          const allPurchasedNFTs = JSON.parse(localStorage.getItem("purchasedNFTs")) || {};
          const userPurchasedNFTs = allPurchasedNFTs[addressKey] || [];
          
          // Add network info to the NFT
          const purchasedNFT = {
            ...item,
            network: currentChainId,
            purchaseDate: new Date().toISOString(),
            transactionHash: transaction.hash
          };
          
          // Check if NFT already exists to avoid duplicates
          if (!userPurchasedNFTs.some(nft => nft.id === item.id && nft.network === currentChainId)) {
            userPurchasedNFTs.push(purchasedNFT);
            allPurchasedNFTs[addressKey] = userPurchasedNFTs;
            localStorage.setItem("purchasedNFTs", JSON.stringify(allPurchasedNFTs));
          }
        } catch (itemError) {
          console.error(`Error processing item ${item.name}:`, itemError);
          toast.error(`Failed to process payment for ${item.name}`);
          throw itemError;
        }
      }

      // Save cart items before clearing
      const purchasedItems = [...cart];
      
      // Clear cart after successful payment
      setCart([]);
      setShowCart(false);
      
      // Remove purchased NFTs from available pics
      const updatedAvailablePics = availablePics.filter(pic => 
        !purchasedItems.some(cartItem => cartItem.id === pic.id)
      );
      setAvailablePics(updatedAvailablePics);
      localStorage.setItem("mintedPics", JSON.stringify(updatedAvailablePics));
      
      toast.success("Payment successful!");
    } catch (err) {
      console.error("Payment error:", err);
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

  // Refresh availablePics when user navigates to gallery
  useEffect(() => {
    if (activePage === "gallery") {
      // Get all purchased NFTs across all users
      const allPurchasedNFTs = JSON.parse(localStorage.getItem("purchasedNFTs")) || {};
      const allPurchasedNFTIds = new Set();
      
      // Collect all purchased NFT IDs
      Object.values(allPurchasedNFTs).forEach(userNFTs => {
        userNFTs.forEach(nft => {
          allPurchasedNFTIds.add(nft.id);
        });
      });
      
      // Get stored NFTs
      const storedPics = JSON.parse(localStorage.getItem("mintedPics")) || [];
      
      // Filter out any NFTs that have been purchased
      const availableNFTs = storedPics.filter(pic => !allPurchasedNFTIds.has(pic.id));
      
      // Update state and localStorage
      setAvailablePics(availableNFTs);
      localStorage.setItem("mintedPics", JSON.stringify(availableNFTs));
    }
  }, [activePage]);

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
