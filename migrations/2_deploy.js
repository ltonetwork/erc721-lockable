const allConfigs = require("../config.json");
const LockableNFT = artifacts.require("./LockableNFT.sol");

module.exports = async function (deployer, network, addresses) {
  const config = allConfigs[network.replace(/-fork$/, '')] || allConfigs.default;

  await deployer.deploy(LockableNFT, config.name, config.symbol);
};