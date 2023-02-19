// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./ILockable.sol";

interface IERC721Lockable is IERC721, ILockable {
    function ownerOf(uint256 tokenId) override(IERC721, ILockable) external view returns (address owner);
}
