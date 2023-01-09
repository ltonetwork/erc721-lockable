// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract LockableNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;

    mapping(uint256 => bool) private lockedTokens;
    string private baseURI;

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) { }

    event Lock(uint256 indexed tokenId);
    event Unlock(uint256 indexed tokenId);

    modifier onlyHolder(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "caller is not the token holder");
        _;
    }



    function mint(bool locked) public returns (uint256) {
        tokenIds.increment();
        uint256 id = tokenIds.current();

        _safeMint(msg.sender, id);
        lockedTokens[id] = locked;

        return id;
    }

    function lock(uint256 tokenId) public onlyHolder(tokenId) {
        require(!lockedTokens[tokenId], "token already locked");

        lockedTokens[tokenId] = true;
        emit Lock(tokenId);
    }

    function unlock(uint256 tokenId) public onlyHolder(tokenId) {
        require(lockedTokens[tokenId], "token not locked");

        lockedTokens[tokenId] = false;
        emit Unlock(tokenId);
    }

    function isLocked(uint256 tokenId) external view returns (bool) {
        ownerOf(tokenId); // Assert
        return lockedTokens[tokenId];
    }

    function setBaseURI(string calldata _uri) public onlyOwner {
        baseURI = _uri;
    }

    function _baseURI() internal view override virtual returns (string memory) {
        return baseURI;
    }
}
