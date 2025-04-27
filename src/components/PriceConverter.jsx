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
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        
        if (!network || !network.chainId) {
          console.warn('Network information not available');
          return;
        }

        const chainId = `0x${network.chainId.toString(16)}`;
        const networkInfo = SUPPORTED_NETWORKS[chainId];
        
        if (networkInfo) {
          setCurrentNetwork(networkInfo);
        } else {
          console.warn(`Unsupported network detected: ${chainId}`);
          // Keep the default Flare network if unsupported network is detected
        }
      } catch (err) {
        console.error('Error getting network:', err);
        // Keep the default Flare network on error
      }
    };

    getNetwork();

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
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
        <h3 className="text-lg font-semibold">Price in {selectedToken.name}</h3>
        <span className="text-sm text-gray-500">
          {currentNetwork ? `Current Network: ${currentNetwork.name}` : 'Loading network...'}
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