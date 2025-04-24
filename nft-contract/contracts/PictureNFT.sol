// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PictureNFT is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;

    mapping(string => bool) public isTokenURIMinted;
    constructor(address initialOwner) ERC721("PictureNFT", "PNFT") Ownable(initialOwner) {
        tokenCounter = 0;
    }

    function mintNFT(address to, string memory tokenURI) public returns (uint256) {

        require(!isTokenURIMinted[tokenURI], "This NFT is already minted");
        uint256 tokenId = tokenCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        tokenCounter++;
        isTokenURIMinted[tokenURI] = true;
        return tokenId;


    }
} 
