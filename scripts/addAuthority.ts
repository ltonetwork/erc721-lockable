import { ethers, network } from "hardhat";

// npx hardhat run scripts/addAuthority.ts --network arbitrumSepolia 2>&1 | tee scripts/logs/addAuthority_arbitrumSepolia_20240530.log
// npx hardhat run scripts/addAuthority.ts --network sepolia 2>&1 | tee scripts/logs/addAuthority_sepolia_20240530.log
async function main() {
  const signers = await ethers.getSigners();
  const accountDeployer = signers[0];
  const accountAuthority = signers[1];

  const authorityBaseURI = "http://localhost:3000";
  console.log("Network  : ", network.name);
  console.log("Deployer : ", await accountDeployer.getAddress());
  console.log("Authority: ", await accountAuthority.getAddress()); // this needs to be the bridge address
  console.log("Authority BaseURI: ", authorityBaseURI); // this needs to be the bridge baseURI

  console.log("Deployer Balance:", await ethers.provider.getBalance(accountDeployer.address));
  const LockableNFT = await ethers.getContractFactory("LockableNFT");

  let lockableNFT;
  if (network.name === "sepolia") {
    lockableNFT = await LockableNFT.attach("0x56213ECA28860d8fb5DAF6A8dCdA7bB28d7c360F");
  }
  if (network.name === "arbitrumSepolia") {
    lockableNFT = await LockableNFT.attach("0x1527f2f8Cd41b000e1E8F70906012bEFab993AD9");
  }
  if (network.name === "sepolia" || network.name === "arbitrumSepolia") {
    await lockableNFT.addAuthority(await accountDeployer.getAddress(), authorityBaseURI);
    console.log("Is account", accountDeployer.address, "Authority?", await lockableNFT.isAuthority(await accountDeployer.getAddress()));
  }

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
