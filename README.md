# NFT Marketplace with Flare Support

A modern, full-featured NFT marketplace built with React and Ethereum smart contracts, with support for the Flare network. This platform allows users to mint, buy, and sell NFTs with a seamless user experience.

## Features

- 🎨 **NFT Minting**: Create and mint your own NFTs with customizable metadata
- 💰 **Buy & Sell**: Trade NFTs using ETH on Sepolia testnet
- 🖼️ **Gallery View**: Browse available NFTs in a responsive grid layout
- 🛒 **Shopping Cart**: Add multiple NFTs to cart before purchase
- 👝 **Wallet Integration**: Connect with MetaMask for transactions
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🔐 **Secure Storage**: NFT metadata stored on IPFS via Pinata
- 📊 **Dashboard**: View your purchased NFTs in one place

## Technology Stack

- Frontend: React.js with Tailwind CSS
- Blockchain: Ethereum (Sepolia Testnet)
- Smart Contracts: Solidity with OpenZeppelin
- File Storage: IPFS (Pinata)
- Web3 Integration: ethers.js
- State Management: React Hooks
- UI Components: Custom components with Tailwind

## Prerequisites

- Node.js (v14+ recommended)
- MetaMask wallet extension
- Sepolia testnet ETH for transactions
- Pinata API keys for IPFS storage

## Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/NFTMarketWithFlareSupport.git
cd NFTMarketWithFlareSupport
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a .env file in the root directory:
\`\`\`env
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_RECEIVER_WALLET=your_receiver_wallet_address
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

## Smart Contract Deployment

1. Navigate to the contract directory:
\`\`\`bash
cd nft-contract
\`\`\`

2. Install contract dependencies:
\`\`\`bash
npm install
\`\`\`

3. Deploy to Sepolia testnet:
\`\`\`bash
npx hardhat run scripts/deploy.js --network sepolia
\`\`\`

## Usage

1. **Connect Wallet**
   - Click "Connect Wallet" to link your MetaMask
   - Ensure you're on Sepolia testnet

2. **Mint NFT**
   - Click "Mint NFT" button
   - Fill in NFT details (name, description, price)
   - Upload image file
   - Confirm transaction in MetaMask

3. **Buy NFT**
   - Browse available NFTs in the gallery
   - Add desired NFTs to cart
   - Click "Pay" to complete purchase
   - Confirm transaction in MetaMask

4. **View Your NFTs**
   - Click "Dashboard" to see purchased NFTs
   - View NFT details and transaction history

## Environment Variables

- `VITE_PINATA_JWT`: Your Pinata API JWT token
- `VITE_RECEIVER_WALLET`: Wallet address for receiving platform fees

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenZeppelin for smart contract libraries
- Pinata for IPFS hosting
- Ethereum community for tools and documentation

## Support

For support, email your-email@example.com or open an issue in the repository.

## Screenshots

[Add screenshots of your application here]