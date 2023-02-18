// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IERC721Lockable is IERC721 {
    event Lock(uint256 indexed tokenId, bytes32 challenge);
    event Unlock(uint256 indexed tokenId);

    function lock(uint256 tokenId) external;
    function unlock(uint256 tokenId, bytes memory proof) external;
    function unlockChallenge(uint256 tokenId) external view returns (bytes32);
    function isLocked(uint256 tokenId) external view returns (bool);
}
