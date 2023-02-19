// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./ILockable.sol";
import "./Verify.sol";

contract LockService is ILockable {
    using Verify for mapping(address => bool);

    IERC721 public erc721;
    mapping(uint256 => bytes32) private lockedTokens;
    mapping(uint256 => address) private owners;
    mapping(address => bool) private authorities;

    constructor(IERC721 _erc721) {
        erc721 = _erc721;
    }

    function ownerOf(uint256 tokenId) external view returns (address owner) {
        return owners[tokenId] != address(0x0) ? owners[tokenId] : erc721.ownerOf(tokenId);
    }

    function lock(uint256 tokenId) external {
        require(_isLocked(tokenId), "token already locked");

        address owner = erc721.ownerOf(tokenId);
        owners[tokenId] = owner;

        erc721.transferFrom(owner, address(this), tokenId);

        bytes32 challenge = keccak256(abi.encodePacked(blockhash(block.number), tokenId));
        lockedTokens[tokenId] = challenge;

        emit Lock(tokenId, challenge);
    }

    function unlock(uint256 tokenId, bytes memory proof) external {
        require(!_isLocked(tokenId), "token not locked");
        require(authorities.verify(lockedTokens[tokenId], proof), "unlock verification failed");

        erc721.transferFrom(address(0), owners[tokenId], tokenId);
        delete owners[tokenId];

        delete lockedTokens[tokenId];

        emit Unlock(tokenId);
    }

    function unlockChallenge(uint256 tokenId) external view returns (bytes32) {
        require(!_isLocked(tokenId), "token not locked");
        return lockedTokens[tokenId];
    }

    function isLocked(uint256 tokenId) external view returns (bool) {
        return _isLocked(tokenId);
    }

    function _isLocked(uint256 tokenId) internal view returns (bool) {
        return lockedTokens[tokenId] != bytes32(0);
    }


    function addAuthority(address account) external {
        require(!authorities[account], "address is already an authority");
        authorities[account] = true;
    }

    function removeAuthority(address account) external {
        require(authorities[account], "address is not an authority");
        delete authorities[account];
    }

    function isAuthority(address account) external view returns (bool) {
        return authorities[account];
    }
}
