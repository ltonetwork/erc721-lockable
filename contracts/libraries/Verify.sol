// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

library Verify {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        return hash
            .toEthSignedMessageHash()
            .recover(signature);
    }

    function verify(address account, bytes32 hash, bytes memory signature) internal pure returns (bool) {
        return recover(hash, signature) == account;
    }

    function verify(
        mapping(address => bool) storage verifiers,
        bytes32 hash,
        bytes memory signature
    ) internal view returns (bool) {
        return verifiers[recover(hash, signature)];
    }
}
