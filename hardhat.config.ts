import * as dotenv from "dotenv";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "hardhat-abi-exporter";
import path from "path";
import "@openzeppelin/hardhat-upgrades";

dotenv.config({ path: path.join(__dirname, ".env") });
// import "@nomicfoundation/hardhat-ethers";
require("@nomicfoundation/hardhat-ethers");
require("hardhat-contract-sizer");
require("hardhat-abi-exporter");

export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
      chainId: 31337,
      accounts: { mnemonic: process.env.TESTNET_MNEMONIC ?? "" },
      forking: {
        enabled: false,
        url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ETH_SEPOLIA_ALCHEMY_API_KEY}`,
      },
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ETH_MAINNET_ALCHEMY_API_KEY}`,
      accounts: { mnemonic: process.env.MAINNET_MNEMONIC ?? "" },
    },
    arbitrumOne: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ARBITRUM_MAINNET_ALCHEMY_API_KEY}`,
      accounts: { mnemonic: process.env.MAINNET_MNEMONIC ?? "" },
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ETH_SEPOLIA_ALCHEMY_API_KEY}`,
      accounts: { mnemonic: process.env.TESTNET_MNEMONIC ?? "" },
    },
    arbitrumSepolia: {
      url: `https://arb-sepolia.g.alchemy.com/v2/${process.env.ARBITRUM_SEPOLIA_ALCHEMY_API_KEY}`,
      accounts: { mnemonic: process.env.TESTNET_MNEMONIC ?? "" },
    },
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env.POLYGON_AMOY_ALCHEMY_API_KEY}`,
      accounts: { mnemonic: process.env.TESTNET_MNEMONIC ?? "" },
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      arbitrumTestnet: process.env.ARBISCAN_API_KEY,
      arbitrumSepolia: process.env.ARBISCAN_API_KEY,
      // polygonAmoy: process.env.POLYGONSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/",
        },
      },
    ],
  },
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 500,
          },
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  abiExporter: {
    path: "./abi",
    pretty: false,
    clear: true,
    runOnCompile: true,
    only: ["ILockable.sol$", "LockableNFT$"],
  },
};
