# Ownable NFT

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
