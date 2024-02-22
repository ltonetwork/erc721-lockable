/* eslint-disable no-console */

import * as dotenv from "dotenv";
// import hre from "hardhat";
import fs from "fs";
import { ethers, network } from "hardhat";

import "@nomiclabs/hardhat-ethers";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

// Example: PARAMETERS=deployments/inputs/deploy_LockableNFT.json npx hardhat run scripts/deploy_LockableNFT.ts --network hardhat 2>&1 | tee scripts/logs/deploy_LockableNFT_hardhat_20240129.log

async function main() {
  const signers = await ethers.getSigners();
  const accountDeployer = signers[0];
  const accountAuthority = signers[1];

  console.log("Network  : ", network.name);
  console.log("Deployer : ", accountDeployer.address);
  console.log("Authority: ", accountAuthority.address);

  let parameters;
  try {
    parameters = JSON.parse(fs.readFileSync(process.env.PARAMETERS + "", "utf8"));
  } catch (error) {
    console.log("Error while reading " + process.env.PARAMETERS);
    console.log(error);
    return;
  }
  console.log("Parameters: ", parameters);

  console.log("Starting deployment...");

  const deployedContract = await (await ethers.getContractFactory("LockableNFT"))
    .connect(accountDeployer)
    .deploy(parameters.default.name, parameters.default.symbol, accountAuthority.address);

  await deployedContract.deployed();
  console.log("LockableNFT contract deployed on network ", network.name, " at address:", deployedContract.address);

  console.log("Is account", accountAuthority.address, "Authority?", await deployedContract.isAuthority(accountAuthority.address));
  await deployedContract.mint(true);
  await deployedContract.mint(false);
  console.log("Is NFT 0 locked?", await deployedContract.isLocked(1));
  console.log("Is NFT 1 locked?", await deployedContract.isLocked(2));


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
