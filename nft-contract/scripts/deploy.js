const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners(); // Use ethers from hre
  console.log("Deploying with:", deployer.address);

  const PictureNFT = await hre.ethers.getContractFactory("PictureNFT");
  console.log("Deploying PictureNFT contract...");

  // Deploy the contract with the deployer's address as the constructor argument
  const pictureNFT = await PictureNFT.deploy(deployer.address, {
    gasLimit: 5000000, // Set gas limit if necessary
  });

  console.log("Waiting for deployment...");
  await pictureNFT.deployed();

  const deployedAddress = pictureNFT.address; // Get the deployed contract's address
  console.log("Picture NFT deployed to:", deployedAddress);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
});
