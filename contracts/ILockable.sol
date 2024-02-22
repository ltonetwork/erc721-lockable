// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILockable {
    event Lock(uint256 indexed tokenId, bytes32 challenge);
    event Unlock(uint256 indexed tokenId);

    event AddAuthority(address indexed account, string _authorityBaseURI);
    event RemoveAuthority(address indexed account);

    event Mint(uint256 indexed id, address indexed _to, bool _locked, string _tokenURI);
    
    function ownerOf(uint256 tokenId) external view returns (address owner);

    function lock(uint256 tokenId) external;
    function unlock(uint256 tokenId, bytes memory proof) external;
    function unlockChallenge(uint256 tokenId) external view returns (bytes32);
    function isLocked(uint256 tokenId) external view returns (bool);

    function isAuthority(address account) external view returns (bool);
    function getAuthorityBaseURI(address account) external view returns (string memory);
    function getAuthorities() external view returns (address[] memory, string[] memory);

    

}
