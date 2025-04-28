import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';

const SUPPORTED_NETWORKS = {
  "0x1": {
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrls: ['https://mainnet.infura.io/v3/your-project-id'],
    blockExplorerUrls: ['https://etherscan.io']
  },
  "0xaa36a7": {
    name: 'Sepolia',
    symbol: 'ETH',
    rpcUrls: ['https://sepolia.infura.io/v3/your-project-id'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  },
  "0x72": {
    name: 'Flare Testnet Coston2',
    symbol: 'C2FLR',
    rpcUrls: ['https://coston2-api.flare.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://coston2-explorer.flare.network']
  },
  "0x89": {
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com']
  },
  "0x44d": {
    name: 'Polygon zkEVM',
    symbol: 'ETH',
    rpcUrls: ['https://zkevm-rpc.com'],
    blockExplorerUrls: ['https://zkevm.polygonscan.com']
  },
  "0x14a34": {
    name: 'Polygon zkEVM',
    symbol: 'ETH',
    rpcUrls: ['https://zkevm-rpc.com'],
    blockExplorerUrls: ['https://zkevm.polygonscan.com']
  },
  "0x13881": {
    name: 'Mumbai',
    symbol: 'MATIC',
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com']
  },
  "0x13882": {
    name: 'Mumbai',
    symbol: 'MATIC',
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com']
  },
  "0x38": {
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com']
  },
  "0xa86a": {
    name: 'Avalanche',
    symbol: 'AVAX',
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io']
  },
  "0xa": {
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io']
  },
  "0xa4b1": {
    name: 'Arbitrum',
    symbol: 'ETH',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io']
  },
  "0x8a3": {
    name: 'Amoy',
    symbol: 'ETH',
    rpcUrls: ['https://ethereum-holesky.publicnode.com'],
    blockExplorerUrls: ['https://amoy.etherscan.io']
  }
};

const SUPPORTED_TOKENS = [
  { 
    symbol: 'FLR/USD', 
    name: 'Flare', 
    icon: '💧', 
    gradient: 'from-blue-500 to-cyan-400',
    iconClass: 'text-blue-500'
  },
  { 
    symbol: 'XRP/USD', 
    name: 'XRP', 
    icon: '🌊', 
    gradient: 'from-cyan-500 to-teal-400',
    iconClass: 'text-cyan-600'
  },
  { 
    symbol: 'BTC/USD', 
    name: 'Bitcoin', 
    icon: '🪙', 
    gradient: 'from-amber-400 to-orange-500',
    iconClass: 'text-amber-500'
  },
  { 
    symbol: 'ETH/USD', 
    name: 'Ethereum', 
    icon: '💎', 
    gradient: 'from-purple-500 to-indigo-500',
    iconClass: 'text-purple-600'
  },
  { 
    symbol: 'MATIC/USD', 
    name: 'Polygon', 
    icon: '🔷', 
    gradient: 'from-purple-400 to-indigo-400',
    iconClass: 'text-indigo-600'
  },
  { 
    symbol: 'BNB/USD', 
    name: 'BNB', 
    icon: '🟡', 
    gradient: 'from-yellow-400 to-yellow-600',
    iconClass: 'text-yellow-500'
  },
  { 
    symbol: 'AVAX/USD', 
    name: 'Avalanche', 
    icon: '❄️', 
    gradient: 'from-red-400 to-red-600',
    iconClass: 'text-red-500'
  }
];

const PriceConverter = ({ ethPrice }) => {
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[1]); // Default to ETH
  const [currentNetwork, setCurrentNetwork] = useState({
    name: 'Flare Testnet Coston2',
    symbol: 'C2FLR'
  }); // Initialize with default Flare network
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [convertedPrice, setConvertedPrice] = useState(null);

  // Get current network from MetaMask
  useEffect(() => {
    const getNetwork = async () => {
      if (!window.ethereum) {
        console.warn('MetaMask is not installed');
        return;
      }

      try {
        // Get network directly from ethereum provider first
        const chainIdHex = await window.ethereum.request({ 
          method: 'eth_chainId'
        });
        console.log("Raw chainId from ethereum:", chainIdHex);
        
        // Then get network from ethers (as backup)
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        
        if (!network || !network.chainId) {
          console.warn('Network information not available from ethers');
          // Still continue with chainIdHex from ethereum
        } else {
          console.log("Network from ethers:", network);
        }

        // Use chainIdHex directly if available, otherwise convert from ethers
        let chainId = chainIdHex || `0x${network.chainId.toString(16)}`;
        
        // Ensure chainId is lowercase for consistent comparison
        chainId = chainId.toLowerCase();
        
        console.log("Final chainId being used:", chainId);
        
        // Print all supported networks for debugging
        console.log("Supported networks:", Object.keys(SUPPORTED_NETWORKS));
        
        // Create a lowercase version of SUPPORTED_NETWORKS keys for case-insensitive matching
        const supportedNetworkKeys = {};
        Object.keys(SUPPORTED_NETWORKS).forEach(key => {
          supportedNetworkKeys[key.toLowerCase()] = SUPPORTED_NETWORKS[key];
        });
        
        // Try to match with case-insensitive comparison
        const networkInfo = supportedNetworkKeys[chainId];
        console.log("Network info found:", networkInfo);
        
        if (networkInfo) {
          setCurrentNetwork(networkInfo);

          // Set token based on network
          let tokenSymbol;
          switch (networkInfo.symbol) {
            case 'MATIC':
              tokenSymbol = 'MATIC/USD';
              break;
            case 'BNB':
              tokenSymbol = 'BNB/USD';
              break;
            case 'AVAX':
              tokenSymbol = 'AVAX/USD';
              break;
            case 'C2FLR':
              tokenSymbol = 'FLR/USD';
              break;
            default:
              tokenSymbol = 'ETH/USD';
              break;
          }
          
          const token = SUPPORTED_TOKENS.find(t => t.symbol === tokenSymbol);
          if (token) {
            console.log("Setting token to:", token.name);
            setSelectedToken(token);
          }
        } else {
          console.warn(`Unsupported network detected: ${chainId}, name: ${network?.name || 'unknown'}`);
          // Default to ETH for unsupported networks
          const ethToken = SUPPORTED_TOKENS.find(t => t.symbol === 'ETH/USD');
          if (ethToken) setSelectedToken(ethToken);
          
          // Set a generic network display with chainId
          setCurrentNetwork({
            name: network?.name || `Network ${chainId}`,
            symbol: 'ETH'
          });
        }
      } catch (err) {
        console.error('Error getting network:', err);
        // Default to ETH on error
        const ethToken = SUPPORTED_TOKENS.find(t => t.symbol === 'ETH/USD');
        if (ethToken) setSelectedToken(ethToken);
      }
    };

    getNetwork();

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        console.log("Chain changed event fired with chainId:", chainId);
        getNetwork();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', getNetwork);
      }
    };
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const apiUrl = 'https://coston2-api.flare.network/ext/bc/C/rpc';
      
      const pricePromises = SUPPORTED_TOKENS.map(token => {
        const data = {
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: '0x0E20E7f2AD89A6181Fb4D51C8f4FC4Bf15573DF1',
              data: '0x4e6eb6ba'
            },
            'latest'
          ],
          id: 1
        };
        
        return axios.post(apiUrl, data)
          .then(response => {
            return {
              symbol: token.symbol,
              price: (Math.random() * 100 + 1).toFixed(2) // Mock price for demo
            };
          });
      });
      
      const results = await Promise.all(pricePromises);
      const priceData = {};
      results.forEach(result => {
        priceData[result.symbol] = result.price;
      });
      
      setPrices(priceData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch price data');
      console.error('Error fetching prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (ethPrice && prices[selectedToken.symbol] && currentNetwork) {
      const ethUsdPrice = parseFloat(prices['ETH/USD']);
      const selectedTokenUsdPrice = parseFloat(prices[selectedToken.symbol]);
      const convertedValue = (ethPrice * ethUsdPrice) / selectedTokenUsdPrice;
      setConvertedPrice(convertedValue.toFixed(6));
    }
  }, [ethPrice, selectedToken, prices, currentNetwork]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Price in {currentNetwork?.symbol || 'ETH'}</h3>
        <span className="text-sm text-gray-500">
          {currentNetwork ? `Network: ${currentNetwork.name}` : 'Loading network...'}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-2">{error}</div>
      ) : (
        <div className="text-center">
          <p className="text-2xl font-bold">
            {convertedPrice ? `${convertedPrice} ${currentNetwork?.symbol || 'ETH'}` : 'Loading...'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Original price: {ethPrice} ETH
          </p>
        </div>
      )}
    </div>
  );
};

export default PriceConverter;
export { SUPPORTED_NETWORKS }; 