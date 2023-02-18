// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./Verify.sol";
import "./IERC721Lockable.sol";

abstract contract ERC721Lockable is ERC721, IERC721Lockable {
    using Verify for mapping(address => bool);

    mapping(uint256 => bytes32) private lockedTokens;
    mapping(address => bool) private authorities;

    function lock(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "caller is not the token holder");
        require(!_isLocked(tokenId), "token already locked");
        _lock(tokenId);
    }

    function _lock(uint256 tokenId) internal {
        bytes32 challenge = keccak256(abi.encodePacked(blockhash(block.number), tokenId));

        lockedTokens[tokenId] = challenge;
        emit Lock(tokenId, challenge);
    }

    function unlock(uint256 tokenId, bytes memory proof) external {
        require(ownerOf(tokenId) == msg.sender, "caller is not the token holder");
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


    function _addAuthority(address account) internal {
        require(!authorities[account], "address is already an authority");
        authorities[account] = true;
    }

    function _removeAuthority(address account) internal {
        require(authorities[account], "address is not an authority");
        delete authorities[account];
    }

    function isAuthority(address account) external view returns (bool) {
        return authorities[account];
    }
}
