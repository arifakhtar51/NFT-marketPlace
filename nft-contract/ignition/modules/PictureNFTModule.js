const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("PictureNFTModule", (m) => {
  // Use deployer as the owner
  const initialOwner = m.getAccount(0); // uses the first account as owner

  const pictureNFT = m.contract("PictureNFT", [initialOwner]);

  return { pictureNFT };
});
