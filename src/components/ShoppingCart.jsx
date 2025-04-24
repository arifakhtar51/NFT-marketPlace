import React from "react";
import PriceConverter from "./PriceConverter";
import { SUPPORTED_NETWORKS } from "./PriceConverter";

export default function ShoppingCart({ 
  cart, 
  handlePay, 
  showCart, 
  onClose, 
  removeFromCart,
  onNetworkChange,
  selectedNetwork
}) {
  if (!showCart) return null;

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-lg z-50 p-6 overflow-y-auto">
      <button className="mb-4 text-gray-500 hover:text-gray-800" onClick={onClose}>
        Close
      </button>
      <h2 className="text-2xl font-semibold mb-4">Shopping Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Payment Network
            </label>
            <select
              value={selectedNetwork.name}
              onChange={(e) => {
                const network = SUPPORTED_NETWORKS.find(n => n.name === e.target.value);
                onNetworkChange(network);
              }}
              className="w-full border rounded-md px-3 py-2"
            >
              {SUPPORTED_NETWORKS.map(network => (
                <option key={network.chainId} value={network.name}>
                  {network.name} ({network.symbol})
                </option>
              ))}
            </select>
          </div>

          <ul>
            {cart.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between mb-4 border-b pb-2"
              >
                <img
                  src={item.src}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded mr-4"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">Ξ {item.price}</p>
                  <PriceConverter 
                    ethPrice={item.price} 
                    onNetworkChange={onNetworkChange}
                  />
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm ml-2"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold">Total in {selectedNetwork.symbol}:</p>
              <p className="font-bold">Ξ {total}</p>
            </div>
            <div className="mb-4">
              <PriceConverter 
                ethPrice={total} 
                onNetworkChange={onNetworkChange}
              />
            </div>
            <button
              onClick={handlePay}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Pay with {selectedNetwork.symbol}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
