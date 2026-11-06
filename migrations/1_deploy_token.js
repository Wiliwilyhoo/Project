
const MoolahCoin = artifacts.require("MoolahCoin");
const Condos = artifacts.require("Condos");

module.exports = async function (deployer) {
  await deployer.deploy(MoolahCoin);
  await deployer.deploy(Condos);
  const condos = await Condos.deployed();
  const owner = await condos.owner();
  const uri = "data:application/json;base64," + Buffer.from(JSON.stringify({
    name: "Condo #1",
    description: "Sample condo NFT"
  })).toString("base64");
  await condos.mintCondo(owner, uri, { from: owner });
};
