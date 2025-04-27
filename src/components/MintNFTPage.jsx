import React, { useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import config from "../utils/config.js"

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MIN_PRICE = 0.00001;
const MAX_PRICE = 1000;

export default function MintNFTPage({ walletAddress, onBack, onAddMintedPic }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [minting, setMinting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const validateInputs = () => {
    const errors = {};
    
    if (!name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!description.trim()) {
      errors.description = "Description is required";
    }
    
    if (!price) {
      errors.price = "Price is required";
    } else {
      const priceNum = parseFloat(price);
      if (priceNum < MIN_PRICE || priceNum > MAX_PRICE) {
        errors.price = `Price must be between ${MIN_PRICE} and ${MAX_PRICE} ETH`;
      }
    }
    
    if (!file) {
      errors.file = "File is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    
    if (selected) {
      if (!SUPPORTED_FILE_TYPES.includes(selected.type)) {
        toast.error("Please upload a supported image file (JPEG, PNG, or GIF)");
        return;
      }
      
      if (selected.size > MAX_FILE_SIZE) {
        toast.error("File size must be less than 10MB");
        return;
      }
      
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setValidationErrors({ ...validationErrors, file: null });
    }
  };

  const handleMint = async () => {
    if (!validateInputs()) {
      toast.error("Please fix the validation errors before minting");
      return;
    }

    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
  
    try {
      setMinting(true);
  
      // Create metadata JSON
      const metadata = {
        name: name.trim(),
        description: description.trim(),
        image: "", // Will be updated after file upload
        attributes: [
          {
            trait_type: "Creator",
            value: walletAddress
          },
          {
            trait_type: "Price",
            value: price
          }
        ]
      };
  
      // Upload image to IPFS
      const imageFormData = new FormData();
      imageFormData.append("file", file);
      imageFormData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));
  
      const imageRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        },
        body: imageFormData,
      });
  
      if (!imageRes.ok) {
        throw new Error("Failed to upload image to IPFS");
      }
  
      const imageResult = await imageRes.json();
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageResult.IpfsHash}`;
      metadata.image = imageUrl;
  
      // Upload metadata to IPFS
      const metadataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        },
        body: JSON.stringify(metadata),
      });
  
      if (!metadataRes.ok) {
        throw new Error("Failed to upload metadata to IPFS");
      }
  
      const metadataResult = await metadataRes.json();
      const tokenUri = `https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`;

      // Get current network for display
      let provider = new ethers.BrowserProvider(window.ethereum);
      let network = await provider.getNetwork();
      let chainId = network.chainId.toString();
      const currentNetworkName = config.NETWORK_NAMES[chainId] || `Network ${chainId}`;

      // Always use Sepolia for minting
      const sepoliaChainId = "11155111";
      const sepoliaContractAddress = config.CONTRACT_ADDRESSES[sepoliaChainId];

      // If not on Sepolia, switch networks
      if (chainId !== sepoliaChainId) {
        const switchToSepolia = window.confirm(
          `NFTs are minted on Sepolia network. You are currently on ${currentNetworkName}. Would you like to switch to Sepolia?`
        );
        
        if (switchToSepolia) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0xaa36a7" }], // Sepolia chain ID
            });
            
            // Wait for network switch to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Refresh provider and network after switch
            provider = new ethers.BrowserProvider(window.ethereum);
            network = await provider.getNetwork();
            chainId = network.chainId.toString();
            
            if (chainId !== sepoliaChainId) {
              throw new Error("Failed to switch to Sepolia network");
            }
          } catch (switchError) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                  chainId: "0xaa36a7",
                  chainName: "Ethereum Sepolia Testnet",
                  rpcUrls: ["https://eth-sepolia.g.alchemy.com/v2/EH0YqqZKDFerFHCBkSo4a15uusnCGdpx"],
                  nativeCurrency: {
                    name: "Sepolia ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                }],
              });
              
              // Wait for network switch to complete
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Refresh provider and network after switch
              provider = new ethers.BrowserProvider(window.ethereum);
              network = await provider.getNetwork();
              chainId = network.chainId.toString();
              
              if (chainId !== sepoliaChainId) {
                throw new Error("Failed to switch to Sepolia network");
              }
            } else {
              throw new Error(`Failed to switch to Sepolia network: ${switchError.message}`);
            }
          }
        } else {
          throw new Error("Minting requires Sepolia network. Please switch to Sepolia to continue.");
        }
      }

      // Connect to contract on Sepolia
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(sepoliaContractAddress, config.ABI, signer);

      // Check if tokenURI is already minted
      try {
        const isMinted = await contract.isTokenURIMinted(tokenUri);
        if (isMinted) {
          throw new Error("This NFT has already been minted");
        }
      } catch (error) {
        if (!error.message.includes("already been minted")) {
          console.error("Error checking token URI:", error);
        }
        throw error;
      }

      // Estimate gas with safety buffer
      let gasEstimate;
      try {
        gasEstimate = await contract.mintNFT.estimateGas(walletAddress, tokenUri);
        console.log("Base gas estimate:", gasEstimate.toString());
      } catch (error) {
        console.error("Gas estimation failed:", error);
        throw new Error("Failed to estimate gas. The transaction might fail.");
      }

      // Convert to BigInt and add 20% buffer
      const gasLimit = (gasEstimate * BigInt(120) / BigInt(100));
      
      // Mint NFT
      console.log("Minting with gas limit:", gasLimit.toString());
      const tx1 = await contract.mintNFT(walletAddress, tokenUri, {
        gasLimit: gasLimit
      });
      
      toast.loading("Minting your NFT...", { id: "mint" });
      console.log("Minting transaction sent:", tx1.hash);
      
      const receipt = await tx1.wait();
      console.log("Minting confirmed in block:", receipt.blockNumber);

      if (receipt.status === 0) {
        throw new Error("Minting transaction failed");
      }

      toast.success("NFT minted successfully!", { id: "mint" });

      // Send fee transaction
      const feeAmount = "0.0001";
      toast.loading("Processing fee transaction...", { id: "fee" });
      
      try {
        const tx2 = await signer.sendTransaction({
          to: import.meta.env.VITE_RECEIVER_WALLET,
          value: ethers.parseEther(feeAmount),
          gasLimit: 21000
        });
        
        const feeReceipt = await tx2.wait();
        console.log("Fee transaction confirmed in block:", feeReceipt.blockNumber);

        if (feeReceipt.status === 0) {
          throw new Error("Fee transaction failed");
        }
        
        toast.success("Fee transaction completed!", { id: "fee" });
      } catch (feeError) {
        console.error("Fee transaction failed:", feeError);
        toast.error("Fee transaction failed, but NFT was minted successfully", { id: "fee" });
      }
  
      const nftDetails = {
        id: Date.now(),
        name: name.trim(),
        description: description.trim(),
        src: imageUrl,
        price: parseFloat(price),
        creator: walletAddress,
        metadata: tokenUri
      };
  
      onAddMintedPic(nftDetails);
    } catch (err) {
      console.error("Minting error:", err);
      toast.error(err.message || "Failed to mint NFT");
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow-xl p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Mint Your NFT</h2>

      <div className="mb-4">
        <input
          type="text"
          className={`w-full px-4 py-2 border rounded ${
            validationErrors.name ? 'border-red-500' : ''
          }`}
          placeholder="NFT Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setValidationErrors({ ...validationErrors, name: null });
          }}
        />
        {validationErrors.name && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
        )}
      </div>

      <div className="mb-4">
        <textarea
          placeholder="NFT Description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setValidationErrors({ ...validationErrors, description: null });
          }}
          className={`w-full px-4 py-2 border rounded ${
            validationErrors.description ? 'border-red-500' : ''
          }`}
        />
        {validationErrors.description && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
        )}
      </div>

      <div className="mb-4">
        <input
          type="number"
          className={`w-full px-4 py-2 border rounded ${
            validationErrors.price ? 'border-red-500' : ''
          }`}
          onChange={(e) => {
            setPrice(e.target.value);
            setValidationErrors({ ...validationErrors, price: null });
          }}
          value={price}
          placeholder={`NFT Price in ETH (${MIN_PRICE}-${MAX_PRICE})`}
          step="0.00001"
          min={MIN_PRICE}
          max={MAX_PRICE}
        />
        {validationErrors.price && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.price}</p>
        )}
      </div>

      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={`w-full ${validationErrors.file ? 'border-red-500' : ''}`}
        />
        <p className="text-sm text-gray-500 mt-1">
          Supported formats: JPEG, PNG, GIF (max 10MB)
        </p>
        {validationErrors.file && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.file}</p>
        )}
      </div>

      {previewUrl && (
        <img src={previewUrl} alt="Preview" className="w-full mb-4 rounded" />
      )}

      <div className="flex justify-between">
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-1/2 mr-2"
          onClick={onBack}
        >
          Back
        </button>

        <button
          className={`${
            minting ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
          } text-white px-4 py-2 rounded w-1/2 ml-2`}
          onClick={handleMint}
          disabled={minting}
        >
          {minting ? "Minting..." : "Mint & Pay"}
        </button>
      </div>
    </div>
  );
}
