const assert = require("node:assert/strict");
const MoolahCoin = artifacts.require("MoolahCoin");
const Condos = artifacts.require("Condos");

contract("Deployment", () => {
  it("records live addresses and mints NFT #1 to the owner", async () => {
    const networkId = String(await web3.eth.net.getId());
    for (const artifact of [MoolahCoin, Condos]) {
      const deployed = await artifact.deployed();
      assert.equal(artifact.networks[networkId].address, deployed.address);
      assert.notEqual(await web3.eth.getCode(deployed.address), "0x");
    }
    const condos = await Condos.deployed();
    assert.equal(await condos.ownerOf(1), await condos.owner());
    const metadata = JSON.parse(Buffer.from((await condos.tokenURI(1)).split(",")[1], "base64").toString());
    assert.equal(metadata.name, "Condo #1");
  });
});
