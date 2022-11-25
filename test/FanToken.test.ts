import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FanToken, FanToken__factory } from "../typechain-types";

import { CoinioToken, CoinioToken__factory } from "../typechain-types";

describe("FanToken Contract", function () {
  let fanToken: FanToken;
  let coinioToken: CoinioToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    let fanFactory = (await ethers.getContractFactory(
      "FanToken",
      owner
    )) as FanToken__factory;

    let name = "FanToken";
    let symbol = "FT";

    fanToken = await fanFactory.deploy(name, symbol);
  });

  beforeEach(async () => {
    let coinioFactory = (await ethers.getContractFactory(
      "CoinioToken",
      owner
    )) as CoinioToken__factory;

    let name = "CoinioToken";
    let symbol = "CT";

    coinioToken = await coinioFactory.deploy(name, symbol);
  });

  describe("Deployment", () => {
    it("FanToken contract is deployed", async () => {
      assert(fanToken.address);
    });

    it("should initialize the contract with correct name and symbol", async () => {
      const name = (await fanToken.name()).toString();
      assert.equal(name, "FanToken");

      const symbol = (await fanToken.symbol()).toString();
      assert.equal(symbol, "FT");
    });
  });

  describe("Controller specific Mint", () => {
    it("whitelist the contract address which can mint", async () => {
      await fanToken.addController(coinioToken.address);
    });

    it("would revert the transaction if the caller is not whitelisted and tries to mint ", async () => {
      await expect(
        fanToken.mint(addr1.address, ethers.utils.parseEther("10"))
      ).to.be.revertedWith("FanToken: only controllers can mint");
    });
  });
});
