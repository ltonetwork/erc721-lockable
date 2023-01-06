// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Contract to mint an NFT for an Ownable.
contract OwnableNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;

    mapping(uint256 => bool) private lockedTokens;
    string private baseURI;

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) { }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyHolder(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Caller is not the token holder");
        _;
    }

    function mint(address to, bool locked) public returns (uint256) {
        tokenIds.increment();
        uint256 id = tokenIds.current();

        _safeMint(to, tokenId);
        lockedTokens[id] = locked;

        return id;
    }

    function lock(uint256 tokenId) public onlyHolder(tokenId) {
        lockedTokens[tokenId] = true;
    }

    function unlock(uint256 tokenId) onlyHolder(tokenId) {
        lockedTokens[tokenId] = false;
    }

    // Set the location for the NFT metadata
    function setBaseURI(string calldata _uri) public onlyOwner {
        baseURI = _uri;
    }
}
