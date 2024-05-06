// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILockable {
    event Lock(uint256 indexed tokenId, bytes32 challenge);
    event Unlock(uint256 indexed tokenId);
    event UpdateProof(uint256 indexed tokenId, bytes32 challenge);
    event AddAuthority(address indexed account, string _authorityBaseURI);
    event RemoveAuthority(address indexed account);
    event Mint(uint256 indexed id, address indexed _to, bool _locked, string _tokenURI);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external;

    function getNftCount() external view returns(uint256);
    function ownerOf(uint256 tokenId) external view returns (address owner);

    function lock(uint256 tokenId) external payable;    
    function unlock(uint256 tokenId, bytes memory proof) external payable;
    function unlockChallenge(uint256 tokenId) external view returns (bytes32);
    function isLocked(uint256 tokenId) external view returns (bool);
   

    function addAuthority(address _account, string memory _authorityBaseURI) external;
    function removeAuthority(address _account) external;
    function getAuthorities() external view returns (address[] memory, string[] memory);
    function isAuthority(address account) external view returns (bool);
    function setAuthorityBaseURI(address _account,string calldata _authorityBaseURI) external;
    function getAuthorityBaseURI(address account) external view returns (string memory);    

    function transferFrom(address from, address to, uint256 tokenId) external;


    

}
