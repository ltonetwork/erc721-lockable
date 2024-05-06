/* eslint-disable no-console */

import * as dotenv from "dotenv";
import fs from "fs";
import { ethers, network } from "hardhat";
import { mine, time } from "@nomicfoundation/hardhat-network-helpers";
// import "@nomiclabs/hardhat-ethers";

import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

// Example: PARAMETERS=deployments/inputs/deploy_LockableNFT.json npx hardhat run scripts/deploy_LockableNFT.ts --network hardhat 2>&1 | tee scripts/logs/deploy_LockableNFT_hardhat_20240504.log
// Example: PARAMETERS=deployments/inputs/deploy_LockableNFT.json npx hardhat run scripts/deploy_LockableNFT.ts --network sepolia 2>&1 | tee scripts/logs/deploy_LockableNFT_sepolia_20240505.log
// Example: PARAMETERS=deployments/inputs/deploy_LockableNFT.json npx hardhat run scripts/deploy_LockableNFT.ts --network arbitrumSepolia 2>&1 | tee scripts/logs/deploy_LockableNFT_arbitrumSepolia_20240505.log
// Example: PARAMETERS=deployments/inputs/deploy_LockableNFT.json npx hardhat run scripts/deploy_LockableNFT.ts --network polygonAmoy 2>&1 | tee scripts/logs/deploy_LockableNFT_polygonAmoy_20240419.log


// Latest:
// https://sepolia.etherscan.io/address/0xaCAD060e94E34AA6026E531fddd7f3F2B854a7AC#code
// https://sepolia.arbiscan.io/address/0x50581c978933af5798f5dbE7FDb0f1bdBa10A171#code
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
    while (currentBlock + 5 > (await ethers.provider.getBlockNumber())) {}
  }

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
    console.log("unlockChallenge0", unlockChallenge);

    const signature = await accountAuthority.signMessage(ethers.toBeArray(unlockChallenge));
    console.log("signature", signature);
    console.log("owner before unlocking", await deployedContract.ownerOf(1));
    console.log("1Is Unlock Proof valid?", await deployedContract.connect(accountAnyone).isUnlockProofValid(1, signature));
    // await mine(15, { interval: 15 });
    // console.log("Latest Block:", await time.latestBlock());
    await deployedContract.connect(accountDeployer).setUnlockFee("1000000000000000"); // 0.001 ETH
    await deployedContract.connect(accountDeployer).setLockFee("2000000000000000"); // 0.002 ETH

    await deployedContract.connect(accountAnyone).unlock(1, signature, { value: ethers.parseEther("0.001") });

    const locked = await deployedContract.isLocked(1);
    console.log(`Is NFT 1 locked? ${locked}`);
    console.log("owner after unlocking", await deployedContract.ownerOf(1));
    console.log("2Is Unlock Proof valid?", await deployedContract.connect(accountAnyone).isUnlockProofValid(1, signature));

    await deployedContract.connect(accountAnyone).lock(1, { value: ethers.parseEther("0.002") });
    console.log("contract Balance:", await ethers.provider.getBalance(deployedContract.getAddress()));
    console.log("unlockChallenge2", await deployedContract.unlockChallenge(1));
    const signature2 = await accountAuthority.signMessage(ethers.toBeArray(await deployedContract.unlockChallenge(1)));
    console.log("3Is Unlock Proof valid?", await deployedContract.connect(accountAnyone).isUnlockProofValid(1, signature));
    console.log("3Is Unlock Proof valid?", await deployedContract.connect(accountAnyone).isUnlockProofValid(1, signature2));

    console.log("unlockChallenge3", await deployedContract.unlockChallenge(1));
    await deployedContract.connect(accountDeployer).updateProof(1);

    console.log("unlockChallenge4", await deployedContract.unlockChallenge(1));
    const signature3 = await accountAuthority.signMessage(ethers.toBeArray(await deployedContract.unlockChallenge(1)));
    console.log("4Is Unlock Proof valid?", await deployedContract.connect(accountAnyone).isUnlockProofValid(1, signature));
    console.log("4Is Unlock Proof valid?", await deployedContract.connect(accountAnyone).isUnlockProofValid(1, signature2));
    console.log("4Is Unlock Proof valid?", await deployedContract.connect(accountAnyone).isUnlockProofValid(1, signature3));
  }

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
