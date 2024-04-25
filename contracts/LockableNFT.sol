// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/Counters.sol";
import "./Verify.sol";
import "./ILockable.sol";

contract LockableNFT is ERC721, ILockable, Ownable {
    using Verify for mapping(address => bool);
    using Counters for Counters.Counter;
   

    Counters.Counter private tokenIds;
    mapping(uint256 => bytes32) private lockedTokens;
    mapping(uint256 => string) tokenURIs;

    Counters.Counter private authoritiesCounter;
    mapping(uint256 => address) private registeredAuthorities;
    mapping(address => bool) private authorities;
    mapping(address => string) private authoritiesBaseURIs;


    constructor(string memory _name, string memory _symbol, address _authority, string memory _authorityBaseURI) ERC721(_name, _symbol) Ownable(msg.sender) {
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

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ILockable) returns (string memory) {
        return tokenURIs[tokenId];
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) external {
        require(ownerOf(tokenId) == msg.sender, "caller is not the token holder");
        tokenURIs[tokenId] = _tokenURI;
    }

    

    function getNftCount() external view returns(uint256) {
        return tokenIds.current();
    }
        
    function ownerOf(uint256 tokenId) virtual override(ERC721, ILockable) public view returns (address owner) {
        return super.ownerOf(tokenId);
    }

    function lock(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "caller is not the token holder");
        require(!_isLocked(tokenId), "token already locked");
        _lock(tokenId);
    }
    function updateProof(uint256 tokenId) external onlyOwner {
        bytes32 challenge = keccak256(abi.encodePacked(blockhash(block.number), tokenId));

        lockedTokens[tokenId] = challenge;
        emit UpdateProof(tokenId, challenge);
    }
    function _lock(uint256 tokenId) internal {
        bytes32 challenge = keccak256(abi.encodePacked(blockhash(block.number), tokenId));

        lockedTokens[tokenId] = challenge;
        emit Lock(tokenId, challenge);
    }

    function unlock(uint256 tokenId, bytes memory proof) external {
        // require(ownerOf(tokenId) == msg.sender, "caller is not the token holder");
        require(_isLocked(tokenId), "token not locked");
        require(authorities.verify(lockedTokens[tokenId], proof), "unlock verification failed");

        delete lockedTokens[tokenId]; // proof can not be reused !
        _transfer(ownerOf(tokenId), msg.sender, tokenId);
        emit Unlock(tokenId);
    }

    function unlockChallenge(uint256 tokenId) external view returns (bytes32) {
        require(_isLocked(tokenId), "token not locked");
        return lockedTokens[tokenId];
    }

    function isLocked(uint256 tokenId) external view returns (bool) {
        ownerOf(tokenId); // Assert that the token exists
        return _isLocked(tokenId);
    }

    function _isLocked(uint256 tokenId) internal view returns (bool) {
        return lockedTokens[tokenId] != bytes32(0);
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

    function _addAuthority(address account, string memory _authorityBaseURI) internal {
        require(!authorities[account], "address is already an authority");
        
        registeredAuthorities[authoritiesCounter.current()]=account;
        authoritiesCounter.increment();

        authorities[account] = true;
        authoritiesBaseURIs[account]= _authorityBaseURI;

    }

    function _removeAuthority(address account) internal {
        require(authorities[account], "address is not an authority");
        authorities[account] = false;
        delete authoritiesBaseURIs[account]; // check if delete is better than setting empty string
    }

    function isAuthority(address account) external view returns (bool) {
        return authorities[account];
    }
    function getAuthorityBaseURI(address account) external view returns (string memory) {
        return authoritiesBaseURIs[account];
    }
    function _setAuthorityBaseURI(address account,string calldata _authorityBaseURI) internal {
        require(authorities[account], "address is not an authority");
        authoritiesBaseURIs[account]= _authorityBaseURI;
    }
    function getAuthorities() external view returns (address[] memory, string[] memory) {
        address[] memory authoritiesArr = new address[](authoritiesCounter.current());
        string[] memory authoritiesBaseURIArr = new string[](authoritiesCounter.current());

    	for(uint256 i=0; i<authoritiesCounter.current(); i++) {     		
    		authoritiesArr[i]=registeredAuthorities[i];
            authoritiesBaseURIArr[i] = authoritiesBaseURIs[registeredAuthorities[i]];
    	}
    	return(authoritiesArr, authoritiesBaseURIArr);
    }
    function transferFrom(address from, address to, uint256 tokenId) public virtual override(ERC721, ILockable) {
        require(_isLocked(tokenId) == false, "Token locked");
        super.safeTransferFrom(from,to,tokenId);
    }
   
}
