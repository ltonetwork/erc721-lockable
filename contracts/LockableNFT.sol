// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/Counters.sol";
import "./Verify.sol";
import "./ILockable.sol";

import "hardhat/console.sol";

contract LockableNFT is ERC721, ILockable, Ownable {
    using Verify for mapping(address => bool);
    using Counters for Counters.Counter;
    
    error SendingEthToSafeFailed();
    error TokenLocked();
    error TokenNotLocked();
    error AddressIsNotAuthority();
    error AddressAlreadyAuthority();
    error UnlockVerificationFailed();
    error IncorrectUnlockFee();
    error IncorrectLockFee();
    error NotTokenOwner();

    Counters.Counter private proofNonce;
    Counters.Counter private tokenIds;
    mapping(uint256 => bytes32) private lockedTokens;
    mapping(uint256 => string) tokenURIs;

    Counters.Counter private authoritiesCounter;    
    mapping(uint256 => address) private registeredAuthorities;
    mapping(address => bool) private authorities;
    mapping(address => string) private authoritiesBaseURIs;
    uint256 private unlockFee;
    uint256 private lockFee;
    

    modifier requireOwned(uint256 _tokenId) {
        _requireOwned(_tokenId);
        _;
    }

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
    
    function setTokenURI(uint256 _tokenId, string memory _tokenURI) external requireOwned(_tokenId) {
        if(ownerOf(_tokenId) != msg.sender) revert NotTokenOwner();
        tokenURIs[_tokenId] = _tokenURI;
    }

    function getUnlockFee() external view returns(uint256) {        
        return unlockFee;
    }

    function setUnlockFee(uint256 _fee) external onlyOwner {
        unlockFee = _fee;
    }

    function getLockFee() external view returns(uint256) {        
        return lockFee;
    }
    function setLockFee(uint256 _fee) external onlyOwner {
        lockFee = _fee;
    }
    function getNftCount() external view returns(uint256) {
        return tokenIds.current();
    }
        
    function ownerOf(uint256 tokenId) virtual override(ERC721, ILockable) public view returns (address owner) {
        return super.ownerOf(tokenId);
    }

    function lock(uint256 _tokenId) external payable {
        if(ownerOf(_tokenId) != msg.sender) revert NotTokenOwner();
        if(_isLocked(_tokenId) == true) revert TokenLocked();
        
        if(msg.value != lockFee) revert IncorrectLockFee();
                
        _lock(_tokenId);
    }

    function updateProof(uint256 tokenId) external onlyOwner requireOwned(tokenId) {
        if(_isLocked(tokenId) == false) revert TokenNotLocked();
        delete lockedTokens[tokenId];
        proofNonce.increment();
        //bytes32 challenge = keccak256(abi.encodePacked(blockhash(block.number), tokenId));        
        bytes32 challenge = keccak256(abi.encodePacked(proofNonce.current(), tokenId));        

        lockedTokens[tokenId] = challenge;
        emit UpdateProof(tokenId, challenge);
    }
    function _lock(uint256 tokenId) internal {
        proofNonce.increment();
        // bytes32 challenge = keccak256(abi.encodePacked(blockhash(block.number), tokenId));
        bytes32 challenge = keccak256(abi.encodePacked(proofNonce.current(), tokenId));        

        lockedTokens[tokenId] = challenge;
        emit Lock(tokenId, challenge);
    }

    function isUnlockProofValid(uint256 tokenId, bytes memory proof) external view requireOwned(tokenId) returns(bool) {
        return(authorities.verify(lockedTokens[tokenId], proof));
    }

    function unlock(uint256 tokenId, bytes memory proof) external payable requireOwned(tokenId) {
        if(_isLocked(tokenId) == false) revert TokenNotLocked();
        if(authorities.verify(lockedTokens[tokenId], proof) == false) revert UnlockVerificationFailed();
        if(msg.value != unlockFee) revert IncorrectUnlockFee();

        delete lockedTokens[tokenId]; // proof can not be reused !
        _transfer(ownerOf(tokenId), msg.sender, tokenId);
        emit Unlock(tokenId);
    }

    function unlockChallenge(uint256 tokenId) external view requireOwned(tokenId) returns (bytes32) {
        if(_isLocked(tokenId) == false) revert TokenNotLocked();
        return lockedTokens[tokenId];
    }

    function isLocked(uint256 tokenId) external view requireOwned(tokenId) returns (bool) {        
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
        if(authorities[account] == true) revert AddressAlreadyAuthority();
        
        registeredAuthorities[authoritiesCounter.current()]=account;
        authoritiesCounter.increment();

        authorities[account] = true;
        authoritiesBaseURIs[account]= _authorityBaseURI;

    }

    function _removeAuthority(address account) internal {
        if(authorities[account] == false) revert AddressIsNotAuthority();
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
        if(authorities[account] == false) revert AddressIsNotAuthority();
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
        if(_isLocked(tokenId) == true) revert TokenLocked();
        super.safeTransferFrom(from,to,tokenId);
    }

    function getEther() external onlyOwner {
        uint256 contractBalance = address(this).balance;
        (bool sent, ) = msg.sender.call{value: contractBalance}("");
        if (!sent) revert SendingEthToSafeFailed();
    }
   
}
