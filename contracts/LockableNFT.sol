// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./IERC721Lockable.sol";
import "./ERC721Lockable.sol";

contract LockableNFT is ERC721Lockable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private tokenIds;
    string private baseURI;

    constructor(string memory _name, string memory _symbol, address _authority) ERC721(_name, _symbol) {
        _addAuthority(_authority);
    }

    function mint(bool locked) external returns (uint256) {
        tokenIds.increment();
        uint256 id = tokenIds.current();

        _safeMint(msg.sender, id);

        if (locked) {
            _lock(id);
        }

        return id;
    }

    function setBaseURI(string calldata _uri) external onlyOwner {
        baseURI = _uri;
    }

    function _baseURI() internal view override virtual returns (string memory) {
        return baseURI;
    }


    function addAuthority(address account) external onlyOwner {
        _addAuthority(account);
    }

    function removeAuthority(address account) external onlyOwner {
        _removeAuthority(account);
    }
}
