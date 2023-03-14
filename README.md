# ERC721 Lockable NFT

`ERC721Lockable` provides a lock mechanism for NFT smart contracts. Only the owner of an NFT can lock it. Unlocking the NFT is done also done by the owner, but requires approval by an authority. The unlock function checks whether the signature provided in the unlock request corresponds to an authorized authority address.

`LockService` can be used by an existing NFT project to provide a similar function. The lock service requires approval for the NFT. To lock the NFT, it is transfered to the lock service. The original owner can unlock providing with a signature of an authority, which will return the NFT to them.

### Ownables

Lockable NFTs can be used in combination with [LTO Ownables](https://docs.ltonetwork.com/ownables). The Ownable is provided as unlockable content for the NFT. At any time, either the NFT or the Ownable is locked. When the NFT is unlocked and tradable, the Ownable needs to be in the locked state and uploaded to an Ownable bridge. When the Ownable is unlocked in the owner's wallet, the NFT needs to be locked to ensure a new owner will always get the most up-to-date version of the Ownable.

### Review by ChatGPT

> Here's a review of the Verify library, ERC721Lockable, and LockableNFT contracts:
>
> #### Verify library:
> The Verify library provides two functions for signature verification. The first function recovers an Ethereum address from a signed message hash and signature, while the second function verifies whether a given address is authorized to perform an action based on the provided signature. The code looks correct and there don't seem to be any security vulnerabilities.
> 
> #### ERC721Lockable:
> ERC721Lockable extends ERC721, and adds the ability to lock and unlock NFTs. The lock and unlock functions require the owner of the NFT to perform the action, and the unlock function additionally requires a valid signature from an authorized address. The Verify library is used to verify the signature. The code looks correct and there don't seem to be any security vulnerabilities.
> 
> #### LockableNFT:
> LockableNFT is an implementation of ERC721Lockable. It allows users to mint new NFTs, set the base URI, and add or remove authorized addresses. The mint function increments a counter to generate a new token ID, mints the token, and optionally locks it based on the argument provided. The setBaseURI function allows the owner to set the base URI for the NFTs. The addAuthority and removeAuthority functions allow the owner to add or remove authorized addresses. The code looks correct and there don't seem to be any security vulnerabilities.
> 
> Overall, the code appears to be well-written and there don't seem to be any major security vulnerabilities. However, it's always possible that there are subtle issues that aren't immediately obvious, so it's important to conduct thorough testing and auditing before deploying the contracts in a production environment.


## Installation

Install dependencies

```bash
$ npm install
```

You could also choose to install Truffle and Ganache globally:

```bash
$ npm install -g truffle truffle-plugin-verify ganache-cli @openzeppelin/contracts
```

**Note:**

if you install truffle and ganache globally, all the project's dependencies (such as `@openzeppelin/contracts`) will also need to be installed globally, otherwise `truffle verify` won't work properly.

## Run tests

```bash
$ npm test
```

## Configuration

Create a `.env` file (look at `.env.example` for reference) or set environment variables:

```bash
MNEMONIC="..."
INFURA_ID="..."
ETHERSCAN_API_KEY="..."
```

- Deployment to rinkeby is done via [Infura](https://infura.io/).
- Create an [Etherscan API key](https://etherscan.io/myapikey) for contract verification.

## Deployment

### Ganache

[Ganache](https://www.trufflesuite.com/ganache) is a personal Ethereum blockchain for development and
tests.

```bash
$ npm run migrate:dev
```

### Goerli

Deploy the smart contract on the [Goerli](https://goerli.etherscan.io/) Ethereum testnet. Make sure your wallet has enough ETH
to pay for the GAS.

**[ChainLink Faucet](https://faucets.chain.link/)**

```bash
$ npm run migrate:rinkeby
```

### Ethereum mainnet

```bash
$ npm run deploy
```
