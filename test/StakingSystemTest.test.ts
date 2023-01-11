import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  RandomApe,
  StakingSystem,
  RewardToken,
  RandomApe__factory,
  StakingSystem__factory,
  RewardToken__factory,
} from "../typechain-types";

describe("Staking Contract", function () {
  let stakingSystem: StakingSystem;
  let randomApe: RandomApe;
  let rewardToken: RewardToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();

    let randomApeFactory = (await ethers.getContractFactory(
      "RandomApe",
      owner
    )) as RandomApe__factory;

    let name = "RandomApe";
    let symbol = "APE";

    randomApe = await randomApeFactory.deploy(name, symbol);
  });

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();

    let rewardTokenFactory = (await ethers.getContractFactory(
      "RewardToken",
      owner
    )) as RewardToken__factory;

    let name = "USDT";
    let symbol = "USDT";

    rewardToken = await rewardTokenFactory.deploy(name, symbol);
  });

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();

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

  describe("Stake  NFT", () => {
    it("should be able to stake a single NFT", async () => {
      await randomApe.mint(addr1.address, "5");
      let balanceOf = await randomApe.balanceOf(addr1.address);
      expect(balanceOf).to.be.equal("5");

      let ownerOf = await randomApe.ownerOf("1");
      expect(ownerOf).to.be.equal(addr1.address);

      await randomApe.connect(addr1).approve(stakingSystem.address, "1");

      await stakingSystem.connect(addr1).stake("1");

      let isStaked = await stakingSystem.nftStatus("1");
      expect(isStaked).to.be.equal(true);

      let tokenOwner = await stakingSystem.tokenOwner("1");
      expect(tokenOwner).to.be.equal(addr1.address);

      let totalStaked = await stakingSystem.totalStaked();
      expect(totalStaked).to.be.equal("1");
    });
  });

  describe("Stake Multiple NFTs", () => {
    it("should be able to stake multiple NFTs", async () => {
      let tokenIds = ["1", "2", "3"];
      await randomApe.mint(addr1.address, "5");
      let balanceOf = await randomApe.balanceOf(addr1.address);
      expect(balanceOf).to.be.equal("5");

      let ownerOf = await randomApe.ownerOf("1");
      expect(ownerOf).to.be.equal(addr1.address);

      await randomApe
        .connect(addr1)
        .setApprovalForAll(stakingSystem.address, true);

      await stakingSystem.connect(addr1).stakeBatch(tokenIds);

      for (var i = 0; i < tokenIds.length; i++) {
        let isStaked = await stakingSystem.nftStatus(tokenIds[i]);
        expect(isStaked).to.be.equal(true);

        let tokenOwner = await stakingSystem.tokenOwner(tokenIds[i]);
        expect(tokenOwner).to.be.equal(addr1.address);
      }

      let totalStaked = await stakingSystem.totalStaked();
      expect(totalStaked).to.be.equal("3");
    });
  });

  describe("Unstake staked NFTs ", () => {
    it("should be able to unstake staked nfts", async () => {
      await randomApe.mint(addr1.address, "5");
      let balanceOf = await randomApe.balanceOf(addr1.address);
      expect(balanceOf).to.be.equal("5");

      let ownerOf = await randomApe.ownerOf("1");
      expect(ownerOf).to.be.equal(addr1.address);

      await randomApe.connect(addr1).approve(stakingSystem.address, "1");

      await stakingSystem.connect(addr1).stake("1");

      let stakedTokensBefore = await stakingSystem.getStakedTokens(
        addr1.address
      );
      console.log("stakedTokens", stakedTokensBefore);

      let isStakedBefore = await stakingSystem.nftStatus("1");
      expect(isStakedBefore).to.be.equal(true);

      let tokenOwner = await stakingSystem.tokenOwner("1");
      expect(tokenOwner).to.be.equal(addr1.address);

      let totalStaked = await stakingSystem.totalStaked();
      expect(totalStaked).to.be.equal("1");

      await stakingSystem.connect(addr1).unstake("1");
      let isStakedAfter = await stakingSystem.nftStatus("1");
      expect(isStakedAfter).to.be.equal(false);

      let stakedTokensAfter = await stakingSystem.getStakedTokens(
        addr1.address
      );

      console.log("stakedTokens", stakedTokensAfter);
    });
  });

  describe("Unstake multiple staked NFTs ", () => {
    it("should be able to unstake multiple staked nfts", async () => {
      let stakeIds = ["1", "2", "3"];
      let unstakeIds = ["1", "2"];
      await randomApe.mint(addr1.address, "5");
      let balanceOf = await randomApe.balanceOf(addr1.address);
      expect(balanceOf).to.be.equal("5");

      let ownerOf = await randomApe.ownerOf("1");
      expect(ownerOf).to.be.equal(addr1.address);

      await randomApe
        .connect(addr1)
        .setApprovalForAll(stakingSystem.address, true);

      await stakingSystem.connect(addr1).stakeBatch(stakeIds);

      let stakedTokensBefore = await stakingSystem.getStakedTokens(
        addr1.address
      );
      console.log("stakedTokensBefore", stakedTokensBefore);

      for (var i = 0; i < stakeIds.length; i++) {
        let isStaked = await stakingSystem.nftStatus(stakeIds[i]);
        expect(isStaked).to.be.equal(true);

        let tokenOwner = await stakingSystem.tokenOwner(stakeIds[i]);
        expect(tokenOwner).to.be.equal(addr1.address);
      }

      let totalStaked = await stakingSystem.totalStaked();
      expect(totalStaked).to.be.equal(stakeIds.length);

      await stakingSystem.connect(addr1).unstakeBatch(unstakeIds);

      for (var i = 0; i < unstakeIds.length; i++) {
        let isStaked = await stakingSystem.nftStatus(unstakeIds[i]);
        expect(isStaked).to.be.equal(false);

        let tokenOwner = await stakingSystem.tokenOwner(unstakeIds[i]);
        expect(tokenOwner).to.be.equal(
          "0x0000000000000000000000000000000000000000"
        );
      }

      let stakedTokensAfter = await stakingSystem.getStakedTokens(
        addr1.address
      );
      console.log("stakedTokensAfter", stakedTokensAfter);
    });
  });
});
