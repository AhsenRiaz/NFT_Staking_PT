import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  StakingSystem,
  StakingSystem__factory,
  RandomApe,
  RandomApe__factory,
  RewardToken,
  RewardToken__factory,
} from "../typechain-types";

describe("NounsToken Contract", function () {
  let stakingSystem: StakingSystem;
  let randomApe: RandomApe;
  let rewardToken: RewardToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    let randomApeFactory = (await ethers.getContractFactory(
      "RandomApe",
      owner
    )) as RandomApe__factory;

    let name = "RandomApe";
    let symbol = "APE";

    randomApe = await randomApeFactory.deploy(name, symbol);
  });

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    let rewardTokenFactory = (await ethers.getContractFactory(
      "RewardToken",
      owner
    )) as RewardToken__factory;

    let name = "USDT";
    let symbol = "USDT";

    rewardToken = await rewardTokenFactory.deploy(name, symbol);
  });

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    let stakingSystemFactory = (await ethers.getContractFactory(
      "StakingSystem",
      owner
    )) as StakingSystem__factory;

    let randomApeAddress = randomApe.address;
    let rewardTokenAddress = rewardToken.address;

    stakingSystem = await stakingSystemFactory.deploy(
      randomApeAddress,
      rewardTokenAddress
    );
  });

  describe("Deployment", () => {
    it("Random Ape Contract is deployed", async () => {
      assert(randomApe.address);
    });

    it("Reward Token Contract is deployed", async () => {
      assert(rewardToken.address);
    });

    it("Staking System Contract is deployed", async () => {
      assert(stakingSystem.address);
    });
  });

  describe("Stake NFT", () => {
    it("should be able to stake a single NFT", async () => {
      await randomApe.mint(addr1.address, "5");
      let balanceOf = await randomApe.balanceOf(addr1.address);
      expect(balanceOf).to.be.equal("5");
      let ownerOf = await randomApe.ownerOf("1");
      expect(ownerOf).to.be.equal(addr1.address);
      await randomApe
        .connect(addr1)
        .setApprovalForAll(stakingSystem.address, true);

      await stakingSystem.connect(addr1).stake(["1"]);
      let balanceOfStakingSystem = (
        await randomApe.balanceOf(stakingSystem.address)
      ).toString();

      expect(balanceOfStakingSystem).to.be.equal("1");
      console.log("balanceOf", balanceOfStakingSystem);
    });
  });

  describe("Stake Multiple NFTs", () => {
    it("should be able to stake multiple NFTs", async () => {
      let stakeTokenIds = ["1", "2", "3"];
      await randomApe.mint(addr1.address, "5");
      let balanceOf = await randomApe.balanceOf(addr1.address);
      expect(balanceOf).to.be.equal("5");
      let ownerOf = await randomApe.ownerOf("1");
      expect(ownerOf).to.be.equal(addr1.address);
      await randomApe
        .connect(addr1)
        .setApprovalForAll(stakingSystem.address, true);

      await stakingSystem.connect(addr1).stake(stakeTokenIds);
      let balanceOfStakingSystem = (
        await randomApe.balanceOf(stakingSystem.address)
      ).toString();

      expect(balanceOfStakingSystem).to.be.equal("3");
    });
  });

  describe("Get Staked NFTs", () => {
    it("should be able to return all the staked NFTs", async () => {
      let stakeTokenIds = ["1", "2", "3"];
      await randomApe.mint(addr1.address, "5");
      let balanceOf = await randomApe.balanceOf(addr1.address);
      expect(balanceOf).to.be.equal("5");
      let ownerOf = await randomApe.ownerOf("1");
      expect(ownerOf).to.be.equal(addr1.address);
      await randomApe
        .connect(addr1)
        .setApprovalForAll(stakingSystem.address, true);

      await stakingSystem.connect(addr1).stake(stakeTokenIds);
      let balanceOfStakingSystem = (
        await randomApe.balanceOf(stakingSystem.address)
      ).toString();

      expect(balanceOfStakingSystem).to.be.equal("3");

      let stakedNFTs = await stakingSystem.tokensOfOwner(addr1.address);
      expect(stakedNFTs.length).to.be.equal(3);
    });
  });

  describe("Unstake staked NFTs ", () => {
    it("should be able to unstake staked nfts", async () => {
      let stakeTokenIds = ["1", "2", "3"];
      let unstakeTokenIds = ["1", "2"];
      await randomApe.mint(addr1.address, "5");
      let balanceOf = await randomApe.balanceOf(addr1.address);
      expect(balanceOf).to.be.equal("5");
      let ownerOf = await randomApe.ownerOf("1");
      expect(ownerOf).to.be.equal(addr1.address);
      await randomApe
        .connect(addr1)
        .setApprovalForAll(stakingSystem.address, true);

      await stakingSystem.connect(addr1).stake(["1", "2", "3"]);
      let beforeBalanceOfStakingSystem = (
        await randomApe.balanceOf(stakingSystem.address)
      ).toString();

      expect(beforeBalanceOfStakingSystem).to.be.equal("3");
      console.log("balanceOf", beforeBalanceOfStakingSystem);

      await stakingSystem.connect(addr1).unstake(unstakeTokenIds);

      for (var i = 0; i < unstakeTokenIds.length; i++) {
        let vault = await stakingSystem.vaults(addr1.address);
      }
    });
  });
});
