// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./LockableNFT.sol";
import "./libraries/Counters.sol";

contract ExampleLockableNFT is LockableNFT {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor(
        string memory _name,
        string memory _symbol,
        address _authority,
        string memory _authorityBaseURI,
        uint256 _maxProofAge
    ) LockableNFT(_name, _symbol, _authority, _authorityBaseURI, _maxProofAge) {}

    function mint(address _to, bool _locked, string memory _tokenURI) external onlyOwner {
        _tokenIds.increment();
        uint256 id = _tokenIds.current();
        _safeMint(_to, id);
        if (_locked) _lock(id);
        tokenURIs[id] = _tokenURI;
        emit Mint(id, _to, _locked, _tokenURI);
    }

    function setTokenURI(uint256 _tokenId, string memory _tokenURI) external {
        if (ownerOf(_tokenId) != msg.sender) revert NotTokenOwner(msg.sender);
        _setTokenURI(_tokenId, _tokenURI);
    }

    function addAuthority(address _account, string memory _authorityBaseURI) external onlyOwner {
        _addAuthority(_account, _authorityBaseURI);
    }

    function removeAuthority(address _account) external onlyOwner {
        _removeAuthority(_account);
    }

    function setLockFee(uint256 _fee) external onlyOwner {
        _setLockFee(_fee);
    }

    function setUnlockFee(uint256 _fee) external onlyOwner {
        _setUnlockFee(_fee);
    }

    function setMaxProofAge(uint256 _maxProofAge) external onlyOwner {
        _setMaxProofAge(_maxProofAge);
    }

    function getEther() external onlyOwner {
        _getEther();
    }

    function isUnlockProofValid(uint256 tokenId, uint256 blockNumber, bytes memory proof) external view returns (bool) {
        return _isUnlockProofValid(tokenId, blockNumber, proof);
    }
}
