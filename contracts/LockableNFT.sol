// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/Counters.sol";
import "./libraries/Verify.sol";
import "./ILockable.sol";

abstract contract LockableNFT is ERC721, ILockable, Ownable {
    using Verify for mapping(address => bool);
    using Counters for Counters.Counter;

    error SendingEthToSafeFailed();
    error TokenLocked(uint256 _tokenId);
    error TokenNotLocked(uint256 _tokenId);
    error AddressIsNotAuthority(address account);
    error UnlockVerificationFailed(uint256 tokenId, bytes proof);
    error IncorrectUnlockFee(uint256 unlockFee, uint256 msgValue);
    error IncorrectLockFee(uint256 lockFee, uint256 msgValue);
    error NotTokenOwner(address account);
    error NFTNotOwned(uint256 tokenId);

    Counters.Counter public proofNonce;
    mapping(uint256 => bytes32) public lockedTokens;
    mapping(uint256 => string) public tokenURIs;

    Counters.Counter public authoritiesCounter;
    mapping(uint256 => address) public registeredAuthorities;
    mapping(address => bool) public authorities;
    mapping(address => string) public authoritiesBaseURIs;
    uint256 public unlockFee;
    uint256 public lockFee;

    modifier requireOwned(uint256 _tokenId) {
        if (_requireOwned(_tokenId) == address(0)) revert NFTNotOwned(_tokenId);
        _;
    }

    constructor(string memory _name, string memory _symbol, address _authority, string memory _authorityBaseURI) ERC721(_name, _symbol) Ownable(msg.sender) {
        _addAuthority(_authority, _authorityBaseURI);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ILockable) returns (string memory) {
        return tokenURIs[tokenId];
    }

    function _setTokenURI(uint256 _tokenId, string memory _tokenURI) internal requireOwned(_tokenId) {
        tokenURIs[_tokenId] = _tokenURI;
    }

    function _setUnlockFee(uint256 _fee) internal {
        unlockFee = _fee;
    }

    function _setLockFee(uint256 _fee) internal {
        lockFee = _fee;
    }

    function ownerOf(uint256 tokenId) virtual override(ERC721, ILockable) public view returns (address owner) {
        return super.ownerOf(tokenId);
    }

    function lock(uint256 _tokenId) external payable {
        if (ownerOf(_tokenId) != msg.sender) revert NotTokenOwner(msg.sender);
        if (_isLocked(_tokenId)) revert TokenLocked(_tokenId);
        if (msg.value != lockFee) revert IncorrectLockFee(lockFee, msg.value);
        _lock(_tokenId);
    }

    function _updateProof(uint256 tokenId) internal requireOwned(tokenId) {
        if (!_isLocked(tokenId)) revert TokenNotLocked(tokenId);
        delete lockedTokens[tokenId];
        proofNonce.increment();
        bytes32 challenge = keccak256(abi.encodePacked(block.chainid, address(this), proofNonce.current(), tokenId));
        lockedTokens[tokenId] = challenge;
        emit UpdateProof(tokenId, challenge);
    }

    function _lock(uint256 tokenId) internal {
        proofNonce.increment();
        bytes32 challenge = keccak256(abi.encodePacked(block.chainid, address(this), proofNonce.current(), tokenId));
        lockedTokens[tokenId] = challenge;
        emit Lock(tokenId, challenge);
    }

    function _isUnlockProofValid(uint256 tokenId, bytes memory proof) internal view requireOwned(tokenId) returns (bool) {
        return authorities.verify(lockedTokens[tokenId], proof);
    }

    function unlock(uint256 tokenId, bytes memory proof) external payable requireOwned(tokenId) {
        if (!_isLocked(tokenId)) revert TokenNotLocked(tokenId);
        if (!_isUnlockProofValid(tokenId, proof)) revert UnlockVerificationFailed(tokenId, proof);
        if (msg.value != unlockFee) revert IncorrectUnlockFee(unlockFee, msg.value);
        delete lockedTokens[tokenId];
        emit Unlock(tokenId);
    }

    function unlockChallenge(uint256 tokenId) external view requireOwned(tokenId) returns (bytes32) {
        if (!_isLocked(tokenId)) revert TokenNotLocked(tokenId);
        return lockedTokens[tokenId];
    }

    function isLocked(uint256 tokenId) external view requireOwned(tokenId) returns (bool) {
        return _isLocked(tokenId);
    }

    function _isLocked(uint256 tokenId) internal view returns (bool) {
        return lockedTokens[tokenId] != bytes32(0);
    }

    function _addAuthority(address account, string memory _authorityBaseURI) internal {
        if (!authorities[account]) {
            registeredAuthorities[authoritiesCounter.current()] = account;
            authoritiesCounter.increment();
            authorities[account] = true;
        }
        authoritiesBaseURIs[account] = _authorityBaseURI; // upsert base URI
        emit AddAuthority(account, _authorityBaseURI);
    }

    function _removeAuthority(address account) internal {
        if (!authorities[account]) revert AddressIsNotAuthority(account);
        authorities[account] = false;
        delete authoritiesBaseURIs[account];
        emit RemoveAuthority(account);
    }

    function isAuthority(address account) external view returns (bool) {
        return authorities[account];
    }

    function getAuthorityBaseURI(address account) external view returns (string memory) {
        return authoritiesBaseURIs[account];
    }

    function getAuthorities() external view returns (address[] memory, string[] memory) {
        address[] memory authoritiesArr = new address[](authoritiesCounter.current());
        string[] memory authoritiesBaseURIArr = new string[](authoritiesCounter.current());
        for (uint256 i = 0; i < authoritiesCounter.current(); i++) {
            authoritiesArr[i] = registeredAuthorities[i];
            authoritiesBaseURIArr[i] = authoritiesBaseURIs[registeredAuthorities[i]];
        }
        return (authoritiesArr, authoritiesBaseURIArr);
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override(ERC721, ILockable) {
        if (_isLocked(tokenId)) revert TokenLocked(tokenId);
        super.transferFrom(from, to, tokenId);
    }

    function _getEther() internal {
        uint256 contractBalance = address(this).balance;
        (bool sent, ) = msg.sender.call{value: contractBalance}("");
        if (!sent) revert SendingEthToSafeFailed();
    }
}
