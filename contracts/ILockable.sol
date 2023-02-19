// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILockable {
    event Lock(uint256 indexed tokenId, bytes32 challenge);
    event Unlock(uint256 indexed tokenId);

    function ownerOf(uint256 tokenId) external view returns (address owner);

    function lock(uint256 tokenId) external;
    function unlock(uint256 tokenId, bytes memory proof) external;
    function unlockChallenge(uint256 tokenId) external view returns (bytes32);
    function isLocked(uint256 tokenId) external view returns (bool);
}
