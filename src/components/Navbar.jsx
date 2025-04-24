export default function Navbar({
  onCartClick,
  cartCount,
  walletAddress,
  onWalletToggle,
  onMintClick,
  onDashboardClick,
  onHomeClick, // Added prop for Home button
}) {
  return (
    <nav className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center">
      <h1 className="text-2xl font-bold">NFT Flower Market</h1>

      <div className="flex gap-4 items-center">
        {/* Home Button */}
        <button
          onClick={onHomeClick}
          className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded"
        >
          Home
        </button>

        <button
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
          onClick={onMintClick}
        >
          Mint NFT
        </button>

        <button
          className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded"
          onClick={onDashboardClick}
        >
          DashBoard
        </button>

        <button
          onClick={onCartClick}
          className="relative bg-purple-600 px-3 py-1 rounded hover:bg-purple-700"
        >
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 rounded-full px-1 text-xs">
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={onWalletToggle}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded"
        >
          {walletAddress
            ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
            : "Connect Wallet"}
        </button>
      </div>
    </nav>
  );
}
