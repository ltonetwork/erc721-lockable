# ERC721 Lockable NFT

`LockableNFT` is an abstract ERC721 contract that adds a lock/unlock mechanism to NFTs. Only the token owner can lock or unlock their token. Unlocking requires a valid signature from a designated authority.

## Ownables

Lockable NFTs are designed for use with [LTO Ownables](https://docs.ltonetwork.com/ownables). The Ownable is provided as unlockable content tied to the NFT. At any time, either the NFT or the Ownable is locked:

- When the NFT is **locked**, the Ownable can be unlocked and used in the owner's wallet.
- When the NFT is **unlocked** and tradable, the Ownable must be locked and held by the authority's bridge, ensuring a new owner always receives the latest version.

## Contracts

### `LockableNFT` (abstract)

The core contract. Inherits from OpenZeppelin's `ERC721` and `Ownable`.

**Authority**

A single authority is configured at deploy time via an Ethereum address and a base URI pointing to the authority's content server. The contract owner can update both via `setAuthority`.

**Locking**

The token owner calls `lock(tokenId)`. An optional `lockFee` (in ETH) can be required.

**Unlocking**

The token owner calls `unlock(tokenId, blockNumber, proof)`. The proof is an ECDSA signature by the authority over:

```
keccak256(chainId, contractAddress, blockhash(blockNumber), tokenId)
```

The signed block must be recent — within `maxProofAge` blocks (between 1 and 255, enforced at deploy time and updatable). This gives proofs a natural expiry without any on-chain nonce management.

**Token URI**

`tokenURI(tokenId)` returns `authorityBaseURI + tokenId`. The content lives on the authority's server; the URI is implicit from the contract configuration and requires no per-token storage.

**Transfer guard**

`transferFrom` reverts if the token is locked, preventing transfers while the associated Ownable is in use.

### `ExampleLockableNFT`

A ready-to-deploy concrete implementation. Exposes:

| Function | Access |
|---|---|
| `mint(address, bool)` | `onlyOwner` |
| `setAuthority(address, string)` | `onlyOwner` |
| `setLockFee(uint256)` | `onlyOwner` |
| `setUnlockFee(uint256)` | `onlyOwner` |
| `setMaxProofAge(uint256)` | `onlyOwner` |
| `getEther()` | `onlyOwner` |

### `Verify` library

Wraps OpenZeppelin's `ECDSA` and `MessageHashUtils`. Provides `recover(hash, signature)` and `verify(account, hash, signature)`.

## Installation

```bash
yarn install
```

## Development

```bash
yarn build   # compile contracts and regenerate TypeScript types
yarn test    # run the test suite
```

## Configuration

Copy `.env.example` to `.env` and fill in the values needed for your target network:

```
ETH_MAINNET_RPC_URL=
ETH_SEPOLIA_RPC_URL=
ETHERSCAN_API_KEY=
```

`ETHERSCAN_API_KEY` is only needed for contract verification via `hardhat verify`.

## Deployment

Configure the target network in `hardhat.config.ts`. The two built-in networks are `mainnet` and `sepolia`.

Write a deploy script that calls:

```solidity
new ExampleLockableNFT(name, symbol, authorityAddress, authorityBaseURI, maxProofAge)
```

Then deploy with:

```bash
yarn hardhat run scripts/your-deploy-script.ts --network sepolia
```
