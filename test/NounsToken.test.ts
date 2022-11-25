import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NounsToken, NounsToken__factory } from "../typechain-types";

describe("NounsToken Contract", function () {
  let nounsToken: NounsToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    let nounsFactory = (await ethers.getContractFactory(
      "NounsToken",
      owner
    )) as NounsToken__factory;

    let name = "NounsToken";
    let symbol = "NT";

    nounsToken = await nounsFactory.deploy(name, symbol);
  });

  describe("Deployment", () => {
    it("NounsToken contract is deployed", async () => {
      assert(nounsToken.address);
    });

    it("should initialize the contract with correct name and symbol", async () => {
      const name = (await nounsToken.name()).toString();
      assert.equal(name, "NounsToken");

      const symbol = (await nounsToken.symbol()).toString();
      assert.equal(symbol, "NT");
    });
  });

  describe("Transfer", () => {
    it("should be able to mint tokens successfully to an address", async () => {
      const tokensToSend = ethers.utils.parseEther("100");
      await nounsToken.mint(addr1.address, tokensToSend);
      const addr1Balance = await nounsToken.balanceOf(addr1.address);

      expect(addr1Balance).to.equal(tokensToSend);
    });

    it("should be able to transfer tokens from one account to another account", async () => {
      await nounsToken.mint(addr1.address, ethers.utils.parseEther("100"));
      const addr1Balance = await nounsToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseEther("100"));

      // send 50 tokens to addr2
      await nounsToken
        .connect(addr1)
        .transfer(addr2.address, ethers.utils.parseEther("50"));
      const addr2Balance = await nounsToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.utils.parseEther("50"));

      const addr1RemainingBalance = await nounsToken.balanceOf(addr1.address);
      expect(addr1RemainingBalance).to.equal(ethers.utils.parseEther("50"));
    });
  });
});
