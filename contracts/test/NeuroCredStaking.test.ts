import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("NeuroCredStaking", function () {
  async function deployStakingFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC20 token for NCRD
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const ncrdToken = await MockERC20.deploy("NeuroCred Token", "NCRD", 18);
    await ncrdToken.waitForDeployment();

    // Deploy staking contract
    const NeuroCredStaking = await ethers.getContractFactory("NeuroCredStaking");
    const staking = await NeuroCredStaking.deploy(await ncrdToken.getAddress(), owner.address);
    await staking.waitForDeployment();

    // Mint tokens to users
    await ncrdToken.mint(user1.address, ethers.parseEther("10000"));
    await ncrdToken.mint(user2.address, ethers.parseEther("5000"));

    return { staking, ncrdToken, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct NCRD token address", async function () {
      const { staking, ncrdToken } = await loadFixture(deployStakingFixture);
      expect(await staking.ncrd()).to.equal(await ncrdToken.getAddress());
    });

    it("Should set the correct owner", async function () {
      const { staking, owner } = await loadFixture(deployStakingFixture);
      expect(await staking.owner()).to.equal(owner.address);
    });
  });

  describe("Staking", function () {
    it("Should allow users to stake NCRD tokens", async function () {
      const { staking, ncrdToken, user1 } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("1000");

      await ncrdToken.connect(user1).approve(await staking.getAddress(), amount);
      await expect(staking.connect(user1).stake(amount))
        .to.emit(staking, "Staked")
        .withArgs(user1.address, amount);

      expect(await staking.stakedAmount(user1.address)).to.equal(amount);
    });

    it("Should reject staking zero amount", async function () {
      const { staking } = await loadFixture(deployStakingFixture);
      await expect(staking.stake(0)).to.be.revertedWith("Amount=0");
    });

    it("Should update staked amount correctly", async function () {
      const { staking, ncrdToken, user1 } = await loadFixture(deployStakingFixture);
      const amount1 = ethers.parseEther("500");
      const amount2 = ethers.parseEther("300");

      await ncrdToken.connect(user1).approve(await staking.getAddress(), amount1 + amount2);
      await staking.connect(user1).stake(amount1);
      await staking.connect(user1).stake(amount2);

      expect(await staking.stakedAmount(user1.address)).to.equal(amount1 + amount2);
    });
  });

  describe("Unstaking", function () {
    it("Should allow users to unstake NCRD tokens", async function () {
      const { staking, ncrdToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseEther("1000");
      const unstakeAmount = ethers.parseEther("400");

      await ncrdToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      await expect(staking.connect(user1).unstake(unstakeAmount))
        .to.emit(staking, "Unstaked")
        .withArgs(user1.address, unstakeAmount);

      expect(await staking.stakedAmount(user1.address)).to.equal(stakeAmount - unstakeAmount);
    });

    it("Should reject unstaking more than staked", async function () {
      const { staking, ncrdToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseEther("1000");
      const unstakeAmount = ethers.parseEther("1500");

      await ncrdToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      await expect(staking.connect(user1).unstake(unstakeAmount))
        .to.be.revertedWith("Invalid amount");
    });
  });

  describe("Integration Tier", function () {
    it("Should return tier 0 for no staking", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);
      expect(await staking.integrationTier(user1.address)).to.equal(0);
    });

    it("Should return tier 1 (Bronze) for 500+ NCRD", async function () {
      const { staking, ncrdToken, user1 } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("500");

      await ncrdToken.connect(user1).approve(await staking.getAddress(), amount);
      await staking.connect(user1).stake(amount);

      expect(await staking.integrationTier(user1.address)).to.equal(1);
    });

    it("Should return tier 2 (Silver) for 2000+ NCRD", async function () {
      const { staking, ncrdToken, user1 } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("2000");

      await ncrdToken.connect(user1).approve(await staking.getAddress(), amount);
      await staking.connect(user1).stake(amount);

      expect(await staking.integrationTier(user1.address)).to.equal(2);
    });

    it("Should return tier 3 (Gold) for 10000+ NCRD", async function () {
      const { staking, ncrdToken, user1 } = await loadFixture(deployStakingFixture);
      const amount = ethers.parseEther("10000");

      await ncrdToken.connect(user1).approve(await staking.getAddress(), amount);
      await staking.connect(user1).stake(amount);

      expect(await staking.integrationTier(user1.address)).to.equal(3);
    });
  });
});

// MockERC20 is now a proper Solidity contract in contracts/contracts/MockERC20.sol

