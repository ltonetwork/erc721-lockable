/* eslint-disable no-console */

import * as dotenv from "dotenv";
import fs from "fs";
import { ethers, network } from "hardhat";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
// import "@nomiclabs/hardhat-ethers";

import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

// Example: PARAMETERS=deployments/inputs/deploy_LockableNFT.json npx hardhat run scripts/deploy_LockableNFT.ts --network hardhat 2>&1 | tee scripts/logs/deploy_LockableNFT_hardhat_20240309.log
// Example: PARAMETERS=deployments/inputs/deploy_LockableNFT.json npx hardhat run scripts/deploy_LockableNFT.ts --network sepolia 2>&1 | tee scripts/logs/deploy_LockableNFT_sepolia_20240419.log
// Example: PARAMETERS=deployments/inputs/deploy_LockableNFT.json npx hardhat run scripts/deploy_LockableNFT.ts --network arbitrumSepolia 2>&1 | tee scripts/logs/deploy_LockableNFT_arbitrumSepolia_20240419.log
// Example: PARAMETERS=deployments/inputs/deploy_LockableNFT.json npx hardhat run scripts/deploy_LockableNFT.ts --network polygonAmoy 2>&1 | tee scripts/logs/deploy_LockableNFT_polygonAmoy_20240419.log

// https://sepolia.etherscan.io/address/0x0eb02E5382944EA6Bf3B79D3253b68289b5d7078#code
// https://sepolia.arbiscan.io/address/0x7FE0d2D2665F3581bcb24eeC1c88283e6371af33#code
async function main() {
  const signers = await ethers.getSigners();
  const accountDeployer = signers[0];
  const accountAuthority = signers[1];
  const accountNftOwner = signers[2];
  const accountAnyone = signers[3];

  const authorityBaseURI = "http://localhost:3000";
  console.log("Network  : ", network.name);
  console.log("Deployer : ", accountDeployer.address);
  console.log("Authority: ", accountAuthority.address); // this needs to be the bridge address
  console.log("Authority BaseURI: ", authorityBaseURI); // this needs to be the bridge baseURI
  console.log("Anyone   : ", accountAnyone.address);
  console.log("NftOwner : ", accountNftOwner.address);

  console.log("Deployer Balance:", await ethers.provider.getBalance(accountDeployer.address));

  let parameters;
  try {
    parameters = JSON.parse(fs.readFileSync(process.env.PARAMETERS + "", "utf8"));
  } catch (error) {
    console.log("Error while reading " + process.env.PARAMETERS);
    console.log(error);
    return;
  }
  console.log("Parameters: ", parameters);

  console.log("Starting deployment to ", network.name, "...");

  const deployedContract = await (await ethers.getContractFactory("LockableNFT"))
    .connect(accountDeployer)
    .deploy(parameters.default.name, parameters.default.symbol, accountAuthority.address, authorityBaseURI);

  //   const deploymentTx = deployedContract.deploymentTransaction();

  // await ethers.provider.waitForTransaction(deploymentTx.hash, 3);
  // console.log("deployedContract", deployedContract);
  // Wait for 5 blocks
  if (network.name === "hardhat") {
    await mine(5);
  } else {
    const currentBlock = await ethers.provider.getBlockNumber();
    while (currentBlock + 5 > (await ethers.provider.getBlockNumber())) { }

  }
  // const test = await deployedContract.waitForDeployment();
  // await test.deploymentTransaction();
  // console.log("test", test);
  // await ethers.provider.waitForTransaction(test.hash, 3);
  const contractAddress = await deployedContract.getAddress();
  console.log("LockableNFT contract deployed on network ", network.name, " at address:", contractAddress);
  console.log(
    `To verify deployment run: npx hardhat verify --network ${network.name} ${contractAddress} '${parameters.default.name}' ${parameters.default.symbol} ${accountAuthority.address} ${authorityBaseURI}`
  );

  console.log("Is account", accountAuthority.address, "Authority?", await deployedContract.isAuthority(accountAuthority.address));

  if (network.name === "hardhat") {
    await deployedContract.mint(accountNftOwner.address, true, "https://black-rigid-chickadee-743.mypinata.cloud/ipfs/QmSHE3ReBy7b8kmVVbyzA2PdiYyxWsQNU89SsAnWycwMhB");
    const locked = await deployedContract.isLocked(1);
    const nftTokenURI = await deployedContract.tokenURI(1);
    console.log(`Is NFT 1 locked? ${locked} with tokenURI: ${nftTokenURI}`);

    try {
      await deployedContract.connect(accountNftOwner).transfer(accountAnyone.address, 1);
    } catch (e) {
      console.log("transfer", e);
    }
    try {
      await deployedContract.connect(accountNftOwner).safeTransferFrom(accountNftOwner.address, accountAnyone.address, 1, "");
    } catch (e) {
      console.log("safeTransferFrom with 4 inputs", e);
    }
    try {
      await deployedContract.connect(accountNftOwner).transferFrom(accountNftOwner.address, accountAnyone.address, 1);
    } catch (e) {
      console.log("transferFrom", e);
    }

    try {
      await deployedContract.connect(accountNftOwner).safeTransferFrom(accountNftOwner.address, accountAnyone.address, 1);
    } catch (e) {
      console.log("safeTransferFrom", e);
    }
  }

  // await deployedContract.mint(accountNftOwner.address, true, "https://black-rigid-chickadee-743.mypinata.cloud/ipfs/QmdP4m1CysGfBhkRJT8S9aZxm1Rq3UHBtfYwgQGiWQDBtA");
  // await deployedContract.mint(accountNftOwner.address, true, "https://black-rigid-chickadee-743.mypinata.cloud/ipfs/QmcBatsmekZmfTMB8jKfP13MGGfyKsR8dEjV9RPfoFvFcU");
  // await deployedContract.mint(accountNftOwner.address, true, "https://black-rigid-chickadee-743.mypinata.cloud/ipfs/QmcMat234uhwCvDFLwouMHHjtyyxytwmvXeucaYPhrUbNp");
  // await deployedContract.mint(accountNftOwner.address, true, "https://black-rigid-chickadee-743.mypinata.cloud/ipfs/QmUN9ruhLk3CVmMSocLU2QWUq82hk4j2XXhqiMbMQ6fWWN");
  // await deployedContract.mint(accountNftOwner.address, true, "https://black-rigid-chickadee-743.mypinata.cloud/ipfs/QmQCR1rMNT7a6JFaDqPwEv9M2uKWq1Q8Hah47s6XkzfcuN");
  // await deployedContract.mint(accountNftOwner.address, true, "https://black-rigid-chickadee-743.mypinata.cloud/ipfs/QmPvM2U4qaH6Bdip7ksLpVythdq6mvsi2iWM9jk9KJ9SqC");
  // await deployedContract.mint(accountNftOwner.address, true, "https://black-rigid-chickadee-743.mypinata.cloud/ipfs/QmYFFnL4s29i67eNLc9rfHfwGkxQhcUpaCM7xJDqSdi656");
  // await deployedContract.mint(accountNftOwner.address, true, "https://black-rigid-chickadee-743.mypinata.cloud/ipfs/Qmd91P4BC1FzNyxVnpHP8YbkJyk7fGJ13kfrU1hwwwK3bq");
  // await deployedContract.mint(accountNftOwner.address, true, "https://black-rigid-chickadee-743.mypinata.cloud/ipfs/Qmd2ukuqsDShMQdRfzNap9dbx2RTNyn7RGBf6mfuMhCHL7");

  // let locked;
  // let nftTokenURI;
  // for (let i = 1; i <= 10; i++) {
  //   locked = await deployedContract.isLocked(i);
  //   nftTokenURI = await deployedContract.tokenURI(i);
  //   console.log(`Is NFT ${i} locked? ${locked} with tokenURI: ${nftTokenURI}`);
  // }
  console.log("Registered Authorities:", await deployedContract.getAuthorities());
  console.log("Base URI of Authority", accountAuthority.address, ":", await deployedContract.getAuthorityBaseURI(accountAuthority.address));
  console.log("Is Authority ", accountAuthority.address, "?", await deployedContract.isAuthority(accountAuthority.address));
  console.log("NFT counter: ", await deployedContract.getNftCount());
  console.log("NFT name: ", await deployedContract.name());
  console.log("NFT symbol: ", await deployedContract.symbol());
  if (network.name === "hardhat") {
    const unlockChallenge = await deployedContract.unlockChallenge(1);
    console.log("unlockChallenge", unlockChallenge);

    const signature = await accountAuthority.signMessage(ethers.toBeArray(unlockChallenge));
    console.log("signature", signature);
    console.log("owner before unlocking", await deployedContract.ownerOf(1));
    await deployedContract.connect(accountAnyone).unlock(1, signature);
    const locked = await deployedContract.isLocked(1);
    console.log(`Is NFT 1 locked? ${locked}`);
    console.log("owner after unlocking", await deployedContract.ownerOf(1));
  }
  // console.log("Removing authority:", await deployedContract.removeAuthority(accountAuthority.address));
  // console.log("Is Authority ", accountAuthority.address, "?", await deployedContract.isAuthority(accountAuthority.address));
  // console.log("Base URI of Authority", accountAuthority.address, ":", await deployedContract.getAuthorityBaseURI(accountAuthority.address));

  // console.log("deployedContract", deployedContract);
  // await deployedContract.connect(accountNftOwner).transferFrom(accountNftOwner.address, accountAnyone.address, 1);
  // await deployedContract.connect(accountNftOwner).safeTransferFrom(accountNftOwner.address, accountAnyone.address, 2);
  // console.log("NFT 1 Owner?", await deployedContract.ownerOf(1));
  // console.log("NFT 2 Owner?", await deployedContract.ownerOf(2));


  const deploymentFile = `deployments/lockableNFT_${network.name}_${new Date().toISOString()}.json`;
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify({
      Network: network.name,
      Deployer: accountDeployer.address,
      Authority: accountAuthority.address,
      AuthorityBaseURI: await deployedContract.getAuthorityBaseURI(accountAuthority.address),
      NFTContractAddress: await deployedContract.getAddress(),
      NFTName: parameters.default.name,
      NFTSymbol: parameters.default.symbol,
    })
  );
  console.log("Deployment completed. Results written to %s", deploymentFile);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
