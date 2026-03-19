// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./libraries/Verify.sol";
import "./ILockable.sol";

abstract contract LockableNFT is ERC721, ILockable {

    error InvalidAuthority();
    error TokenLocked(uint256 _tokenId);
    error TokenNotLocked(uint256 _tokenId);
    error UnlockVerificationFailed(uint256 tokenId, bytes proof);
    error IncorrectUnlockFee(uint256 unlockFee, uint256 msgValue);
    error IncorrectLockFee(uint256 lockFee, uint256 msgValue);
    error NotTokenOwner(address account);
    error ProofExpired(uint256 blockNumber);
    error InvalidMaxProofAge(uint256 value);

    event LockFeeUpdated(uint256 fee);
    event UnlockFeeUpdated(uint256 fee);
    event MaxProofAgeUpdated(uint256 maxProofAge);

    mapping(uint256 => bool) internal lockedTokens;

    address public authority;
    string public authorityBaseURI;
    uint256 public unlockFee;
    uint256 public lockFee;
    uint256 public maxProofAge;

    modifier requireOwned(uint256 _tokenId) {
        _requireOwned(_tokenId);
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _authority,
        string memory _authorityBaseURI,
        uint256 _maxProofAge
    ) ERC721(_name, _symbol) {
        _setAuthority(_authority, _authorityBaseURI);
        _setMaxProofAge(_maxProofAge);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ILockable) returns (string memory) {
        _requireOwned(tokenId);
        return string.concat(authorityBaseURI, Strings.toString(tokenId));
    }

    function _setAuthority(address _authority, string memory _authorityBaseURI) internal {
        authority = _authority;
        authorityBaseURI = _authorityBaseURI;
        emit AuthorityUpdated(_authority, _authorityBaseURI);
    }

    function _setUnlockFee(uint256 _fee) internal {
        unlockFee = _fee;
        emit UnlockFeeUpdated(_fee);
    }

    function _setLockFee(uint256 _fee) internal {
        lockFee = _fee;
        emit LockFeeUpdated(_fee);
    }

    function _setMaxProofAge(uint256 _maxProofAge) internal {
        if (_maxProofAge == 0 || _maxProofAge >= 256) revert InvalidMaxProofAge(_maxProofAge);
        maxProofAge = _maxProofAge;
        emit MaxProofAgeUpdated(_maxProofAge);
    }

    function ownerOf(uint256 tokenId) virtual override(ERC721, ILockable) public view returns (address owner) {
        return super.ownerOf(tokenId);
    }

    function lock(uint256 _tokenId) external payable {
        if (authority == address(0)) revert InvalidAuthority();
        if (ownerOf(_tokenId) != msg.sender) revert NotTokenOwner(msg.sender);
        if (_isLocked(_tokenId)) revert TokenLocked(_tokenId);
        if (msg.value != lockFee) revert IncorrectLockFee(lockFee, msg.value);
        _lock(_tokenId);
    }

    function _lock(uint256 tokenId) internal {
        lockedTokens[tokenId] = true;
        emit Lock(tokenId);
    }

    function unlock(uint256 tokenId, uint256 blockNumber, bytes memory proof) external payable {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner(msg.sender);
        if (!_isLocked(tokenId)) revert TokenNotLocked(tokenId);
        if (msg.value != unlockFee) revert IncorrectUnlockFee(unlockFee, msg.value);
        if (blockNumber >= block.number || block.number - blockNumber > maxProofAge) revert ProofExpired(blockNumber);
        bytes32 challenge = keccak256(abi.encodePacked(block.chainid, address(this), blockhash(blockNumber), tokenId));
        if (!Verify.verify(authority, challenge, proof)) revert UnlockVerificationFailed(tokenId, proof);
        delete lockedTokens[tokenId];
        emit Unlock(tokenId);
    }

    function isLocked(uint256 tokenId) external view requireOwned(tokenId) returns (bool) {
        return _isLocked(tokenId);
    }

    function _isLocked(uint256 tokenId) internal view returns (bool) {
        return authority != address(0) && lockedTokens[tokenId];
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override(ERC721, ILockable) {
        if (_isLocked(tokenId)) revert TokenLocked(tokenId);
        super.transferFrom(from, to, tokenId);
    }

}
