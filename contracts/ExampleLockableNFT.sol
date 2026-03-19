// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LockableNFT.sol";

contract ExampleLockableNFT is LockableNFT, Ownable {

    error SendingEthToSafeFailed();
    uint256 private _tokenIds;

    constructor(
        string memory _name,
        string memory _symbol,
        address _authority,
        string memory _authorityBaseURI,
        uint256 _maxProofAge
    ) LockableNFT(_name, _symbol, _authority, _authorityBaseURI, _maxProofAge) Ownable(msg.sender) {}

    function mint(address _to, bool _locked) external onlyOwner {
        uint256 id = ++_tokenIds;
        _safeMint(_to, id);
        if (_locked) _lock(id);
        emit Mint(id, _to, _locked);
    }

    function setAuthority(address _authority, string memory _authorityBaseURI) external onlyOwner {
        _setAuthority(_authority, _authorityBaseURI);
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
        uint256 contractBalance = address(this).balance;
        (bool sent, ) = owner().call{value: contractBalance}("");
        if (!sent) revert SendingEthToSafeFailed();
    }
}
