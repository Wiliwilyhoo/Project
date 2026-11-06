
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Condos is ERC721URIStorage, Ownable {
    uint256 public nextTokenId = 1;

    constructor() ERC721("Condos", "CONDO") {}

    // Chỉ owner được mint NFT
    function mintCondo(address to, string memory uri)
        external
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = nextTokenId;
        nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        return tokenId;
    }
}
