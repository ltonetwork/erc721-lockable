// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILockable {
    event Lock(uint256 indexed tokenId);
    event Unlock(uint256 indexed tokenId);
    event AuthorityUpdated(address indexed authority, string baseURI);
    event Mint(uint256 indexed id, address indexed _to, bool _locked);

    function tokenURI(uint256 tokenId) external view returns (string memory);
    function ownerOf(uint256 tokenId) external view returns (address owner);

    function lock(uint256 tokenId) external payable;
    function unlock(uint256 tokenId, uint256 blockNumber, bytes memory proof) external payable;
    function isLocked(uint256 tokenId) external view returns (bool);

    function transferFrom(address from, address to, uint256 tokenId) external;
}
