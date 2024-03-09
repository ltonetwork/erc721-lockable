/* eslint-disable no-console */

import * as dotenv from "dotenv";
import fs from "fs";
import { ethers, network } from "hardhat";

import "@nomiclabs/hardhat-ethers";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

// Example: PARAMETERS=deployments/inputs/deploy_LockableNFT.json npx hardhat run scripts/deploy_LockableNFT.ts --network hardhat 2>&1 | tee scripts/logs/deploy_LockableNFT_hardhat_20240309.log
// Example: PARAMETERS=deployments/inputs/deploy_LockableNFT.json npx hardhat run scripts/deploy_LockableNFT.ts --network arbitrumSepolia 2>&1 | tee scripts/logs/deploy_LockableNFT_arbitrumSepolia_20240309.log
// Example: PARAMETERS=deployments/inputs/deploy_LockableNFT.json npx hardhat run scripts/deploy_LockableNFT.ts --network polygonMumbai 2>&1 | tee scripts/logs/deploy_LockableNFT_polygonMumbai_20240309.log
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

  console.log("Deployer Balance:", await accountDeployer.getBalance());

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

  await deployedContract.deployed();
  console.log("LockableNFT contract deployed on network ", network.name, " at address:", deployedContract.address);
  console.log(
    `To verify deployment run: npx hardhat verify --network ${network.name} ${deployedContract.address} '${parameters.default.name}' ${parameters.default.symbol} ${accountAuthority.address} ${authorityBaseURI}`
  );

  console.log("Is account", accountAuthority.address, "Authority?", await deployedContract.isAuthority(accountAuthority.address));
  // await deployedContract.mint(accountNftOwner.address, true, "https://black-rigid-chickadee-743.mypinata.cloud/ipfs/QmSHE3ReBy7b8kmVVbyzA2PdiYyxWsQNU89SsAnWycwMhB");
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

  // console.log("Removing authority:", await deployedContract.removeAuthority(accountAuthority.address));
  // console.log("Is Authority ", accountAuthority.address, "?", await deployedContract.isAuthority(accountAuthority.address));
  // console.log("Base URI of Authority", accountAuthority.address, ":", await deployedContract.getAuthorityBaseURI(accountAuthority.address));

  // console.log("deployedContract", deployedContract);
  // await deployedContract.connect(accountNftOwner).transferFrom(accountNftOwner.address, accountAnyone.address, 1);
  // await deployedContract.connect(accountNftOwner).safeTransferFrom(accountNftOwner.address, accountAnyone.address, 2);
  // console.log("NFT 1 Owner?", await deployedContract.ownerOf(1));
  // console.log("NFT 2 Owner?", await deployedContract.ownerOf(2));

  const deploymentFile = `deployments/lockableNFT_forNFTParis_${network.name}_${new Date().toISOString()}.json`;
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify({
      Network: network.name,
      Deployer: accountDeployer.address,
      Authority: accountAuthority.address,
      AuthorityBaseURI: await deployedContract.getAuthorityBaseURI(accountAuthority.address),
      NFTContractAddress: deployedContract.address,
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
