import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CoinioToken, CoinioToken__factory } from "../typechain-types";

describe("CoinioToken Contract", function () {
  let coinioToken: CoinioToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    let coinioFactory = (await ethers.getContractFactory(
      "CoinioToken",
      owner
    )) as CoinioToken__factory;

    let name = "CoinioToken";
    let symbol = "CT";

    coinioToken = await coinioFactory.deploy(name, symbol);
  });

  describe("Deployment", () => {
    it("CoinioToken contract is deployed", async () => {
      assert(coinioToken.address);
    });

    it("should initialize the contract with correct name and symbol", async () => {
      const name = (await coinioToken.name()).toString();
      assert.equal(name, "CoinioToken");

      const symbol = (await coinioToken.symbol()).toString();
      assert.equal(symbol, "CT");
    });
  });

  describe("Transfer", () => {
    it("should be able to mint tokens successfully to an address", async () => {
      const tokensToSend = ethers.utils.parseEther("100");
      await coinioToken.mint(addr1.address, tokensToSend);
      const addr1Balance = await coinioToken.balanceOf(addr1.address);

      expect(addr1Balance).to.equal(tokensToSend);
    });

    it("should be able to transfer tokens from one account to another account", async () => {
      await coinioToken.mint(addr1.address, ethers.utils.parseEther("100"));
      const addr1Balance = await coinioToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseEther("100"));

      // send 50 tokens to addr2
      await coinioToken
        .connect(addr1)
        .transfer(addr2.address, ethers.utils.parseEther("50"));
      const addr2Balance = await coinioToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.utils.parseEther("50"));

      const addr1RemainingBalance = await coinioToken.balanceOf(addr1.address);
      expect(addr1RemainingBalance).to.equal(ethers.utils.parseEther("50"));
    });
  });
});
