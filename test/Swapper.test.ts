import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  CoinioToken,
  CoinioToken__factory,
  FanToken,
  FanToken__factory,
} from "../typechain-types";
import { NounsToken, NounsToken__factory } from "../typechain-types";
import { Swapper, Swapper__factory } from "../typechain-types";

describe("Swapper Contract", () => {
  let swapper: Swapper;
  let nounsToken: NounsToken;
  let fanToken: FanToken;
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
    [owner, addr1, addr2] = await ethers.getSigners();

    let swapperFactory = (await ethers.getContractFactory(
      "Swapper",
      owner
    )) as Swapper__factory;

    swapper = await swapperFactory.deploy(
      fanToken.address,
      nounsToken.address,
      coinioToken.address
    );
  });

  describe("Deployment", () => {
    it("Swapper contract is deployed", async () => {
      assert(swapper.address);
    });

    it("should deploy with the correct fanToken address", async () => {
      expect(await swapper.getFanTokenAddress()).to.equal(fanToken.address);
    });
  });

  describe("Verify Revert StatementsI", () => {
    it("should revert if amount is zero", async () => {
      await expect(
        swapper.swap(fanToken.address, ethers.utils.parseEther("0"))
      ).to.be.revertedWith("Swapper: amount is zero");
    });

    it("should revert if the user balance is less than the amount", async () => {
      await expect(
        swapper.swap(fanToken.address, ethers.utils.parseEther("1"))
      ).to.be.revertedWith("Swapper: insufficient balance");
    });
  });

  describe("Swap", () => {
    it("shoud expect an address to have tokens to swap", async () => {
      const tokensToMint = ethers.utils.parseEther("1000");
      await nounsToken.mint(addr1.address, tokensToMint);
      const addr1Balance = await nounsToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(tokensToMint);
    });

    it("should expect the swapper contract to be approved", async () => {
      const tokensToMint = ethers.utils.parseEther("1000");
      await nounsToken.mint(addr1.address, tokensToMint);
      let tokensToSwap = ethers.utils.parseEther("100");
      await nounsToken.connect(addr1).approve(swapper.address, tokensToSwap);

      let allowance = await nounsToken.allowance(
        addr1.address,
        swapper.address
      );

      expect(allowance).to.equal(ethers.utils.parseEther("100"));
      expect(allowance).to.be.greaterThanOrEqual(tokensToSwap);
    });

    it("should swap 100 tokens", async () => {
      fanToken.addController(swapper.address);
      const tokensToMint = ethers.utils.parseEther("1000");
      await nounsToken.mint(addr1.address, tokensToMint);
      const tokensToSwap = ethers.utils.parseEther("100");
      await nounsToken.connect(addr1).approve(swapper.address, tokensToSwap);
      await swapper.connect(addr1).swap(nounsToken.address, tokensToSwap);

      let addr1NounsBalance = await nounsToken.balanceOf(addr1.address);
      expect(addr1NounsBalance).to.equal(ethers.utils.parseEther("900"));

      let addr1FanBalance = await fanToken.balanceOf(addr1.address);
      expect(addr1FanBalance).to.equal(ethers.utils.parseEther("100"));
    });

    it("should unswap 50 tokens", async () => {
      // swapping to unswap
      fanToken.addController(swapper.address);
      const tokensToMint = ethers.utils.parseEther("1000");
      await nounsToken.mint(addr1.address, tokensToMint);
      const tokensToSwap = ethers.utils.parseEther("100");
      await nounsToken.connect(addr1).approve(swapper.address, tokensToSwap);
      await swapper.connect(addr1).swap(nounsToken.address, tokensToSwap);

      // addr1 nounsToken balance reduced
      let addr1NounsBalance = await nounsToken.balanceOf(addr1.address);
      console.log("addr1NounsBalance", addr1NounsBalance);
      expect(addr1NounsBalance).to.equal(ethers.utils.parseEther("900"));

      // addr1 fanToken balance increased
      let addr1FanBalance = await fanToken.balanceOf(addr1.address);
      console.log("addr1FanBalance", addr1FanBalance);
      expect(addr1FanBalance).to.equal(ethers.utils.parseEther("100"));

      const totalSupply = await nounsToken.totalSupply();
      console.log("totalSUpply", totalSupply);
    });
  });
});
