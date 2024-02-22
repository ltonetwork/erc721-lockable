// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// import "./IERC721Lockable.sol";
import "./ERC721Lockable.sol";

contract LockableNFT is ERC721Lockable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private tokenIds;
    mapping(uint256 => string) tokenURIs;

    constructor(string memory _name, string memory _symbol, address _authority, string memory _authorityBaseURI) ERC721(_name, _symbol) {
        _addAuthority(_authority, _authorityBaseURI);
        
    }

    function mint(address _to, bool _locked, string memory _tokenURI) external onlyOwner {
        tokenIds.increment(); // NFT IDs start with 1
        uint256 id = tokenIds.current();

        _safeMint(_to, id);

        if (_locked) {
            _lock(id);
        }
        tokenURIs[id] = _tokenURI;
        emit Mint(id, _to, _locked, _tokenURI);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return tokenURIs[tokenId];
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) external {
        require(ownerOf(tokenId) == msg.sender, "caller is not the token holder");
        tokenURIs[tokenId] = _tokenURI;
    }

    function addAuthority(address _account, string memory _authorityBaseURI) external onlyOwner {
        _addAuthority(_account,_authorityBaseURI);

    }

    function removeAuthority(address _account) external onlyOwner {
        _removeAuthority(_account);
    }
    function setAuthorityBaseURI(address _account,string calldata _authorityBaseURI) external onlyOwner {
        _setAuthorityBaseURI(_account, _authorityBaseURI);
    }
        
}
