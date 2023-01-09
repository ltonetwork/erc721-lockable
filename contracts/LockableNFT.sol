// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Verify.sol";

contract LockableNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    using Verify for mapping(address => bool);

    Counters.Counter private tokenIds;

    mapping(uint256 => bytes32) private lockedTokens;
    string private baseURI;

    mapping(address => bool) private authorities;

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) { }

    event Lock(uint256 indexed tokenId, bytes32 challenge);
    event Unlock(uint256 indexed tokenId);

    modifier onlyHolder(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "caller is not the token holder");
        _;
    }

    function mint(bool locked) public returns (uint256) {
        tokenIds.increment();
        uint256 id = tokenIds.current();

        _safeMint(msg.sender, id);

        if (locked) {
            _lock(id);
        }

        return id;
    }

    function setBaseURI(string calldata _uri) public onlyOwner {
        baseURI = _uri;
    }

    function _baseURI() internal view override virtual returns (string memory) {
        return baseURI;
    }


    function lock(uint256 tokenId) public onlyHolder(tokenId) {
        require(!_isLocked(tokenId), "token already locked");
        _lock(tokenId);
    }

    function _lock(uint256 tokenId) internal {
        bytes32 challenge = keccak256(abi.encodePacked(blockhash(block.number), tokenId));

        lockedTokens[tokenId] = challenge;
        emit Lock(tokenId, challenge);
    }

    function unlock(uint256 tokenId, bytes memory proof) public onlyHolder(tokenId) {
        require(_isLocked(tokenId), "token not locked");
        require(authorities.verify(lockedTokens[tokenId], proof), "unlock verification failed");

        delete lockedTokens[tokenId];
        emit Unlock(tokenId);
    }

    function unlockChallenge(uint256 tokenId) external view returns (bytes32) {
        require(_isLocked(tokenId), "token not locked");
        return lockedTokens[tokenId];
    }

    function isLocked(uint256 tokenId) external view returns (bool) {
        ownerOf(tokenId); // Assert that the token exists
        return _isLocked(tokenId);
    }

    function _isLocked(uint256 tokenId) internal view returns (bool) {
        return lockedTokens[tokenId] != bytes32(0);
    }


    function addAuthority(address account) public onlyOwner {
        require(!authorities[account], "address is already an authority");
        authorities[account] = true;
    }

    function removeAuthority(address account) public onlyOwner {
        require(authorities[account], "address is not an authority");
        delete authorities[account];
    }

    function isAuthority(address account) external view returns (bool) {
        return authorities[account];
    }
}
