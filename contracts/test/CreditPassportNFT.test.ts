import { expect } from "chai";
import { ethers } from "hardhat";
import { CreditPassportNFT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CreditPassportNFT", function () {
  let passportNFT: CreditPassportNFT;
  let admin: HardhatEthersSigner;
  let scoreUpdater: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [admin, scoreUpdater, user1, user2] = await ethers.getSigners();

    // Deploy contract
    const CreditPassportNFTFactory = await ethers.getContractFactory("CreditPassportNFT");
    passportNFT = await CreditPassportNFTFactory.deploy(admin.address);
    await passportNFT.waitForDeployment();

    // Grant score updater role
    await passportNFT.connect(admin).setScoreUpdater(scoreUpdater.address, true);
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await passportNFT.hasRole(await passportNFT.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it("Should grant score updater role", async function () {
      expect(await passportNFT.hasRole(await passportNFT.SCORE_UPDATER_ROLE(), scoreUpdater.address)).to.be.true;
    });

    it("Should have correct name and symbol", async function () {
      expect(await passportNFT.name()).to.equal("NeuroCred Credit Passport");
      expect(await passportNFT.symbol()).to.equal("NCCP");
    });
  });

  describe("Minting and Updating Scores", function () {
    it("Should mint a new passport for a user", async function () {
      const score = 750;
      const riskBand = 1;

      await expect(
        passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, score, riskBand)
      ).to.emit(passportNFT, "PassportMinted")
        .withArgs(user1.address, 1);

      const tokenId = await passportNFT.passportIdOf(user1.address);
      expect(tokenId).to.equal(1);
      expect(await passportNFT.ownerOf(tokenId)).to.equal(user1.address);
    });

    it("Should update existing passport score", async function () {
      // First mint
      await passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, 750, 1);
      
      // Update score
      const newScore = 850;
      const newRiskBand = 1;

      const tx = await passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, newScore, newRiskBand);
      await expect(tx)
        .to.emit(passportNFT, "ScoreUpdated")
        .withArgs(user1.address, 1, newScore, newRiskBand, (value: any) => typeof value === "bigint");

      const scoreView = await passportNFT.getScore(user1.address);
      expect(scoreView.score).to.equal(newScore);
      expect(scoreView.riskBand).to.equal(newRiskBand);
    });

    it("Should reject minting from non-authorized address", async function () {
      await expect(
        passportNFT.connect(user1).mintOrUpdate(user2.address, 750, 1)
      ).to.be.revertedWithCustomError(passportNFT, "AccessControlUnauthorizedAccount");
    });

    it("Should reject invalid score (> 1000)", async function () {
      await expect(
        passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, 1001, 1)
      ).to.be.revertedWith("Score too high");
    });

    it("Should reject invalid risk band (> 3)", async function () {
      await expect(
        passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, 750, 4)
      ).to.be.revertedWith("Invalid risk band");
    });
  });

  describe("Score Queries", function () {
    it("Should return zero score for unscored user", async function () {
      const scoreView = await passportNFT.getScore(user1.address);
      expect(scoreView.score).to.equal(0);
      expect(scoreView.riskBand).to.equal(0);
      expect(scoreView.lastUpdated).to.equal(0);
    });

    it("Should return correct score for scored user", async function () {
      const score = 850;
      const riskBand = 1;

      await passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, score, riskBand);

      const scoreView = await passportNFT.getScore(user1.address);
      expect(scoreView.score).to.equal(score);
      expect(scoreView.riskBand).to.equal(riskBand);
      expect(scoreView.lastUpdated).to.be.gt(0);
    });

    it("Should return score by token ID", async function () {
      await passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, 750, 1);
      const tokenId = await passportNFT.passportIdOf(user1.address);

      const scoreData = await passportNFT.getScoreByToken(tokenId);
      expect(scoreData.score).to.equal(750);
      expect(scoreData.riskBand).to.equal(1);
    });
  });

  describe("Soulbound Logic", function () {
    it("Should prevent transfers between users", async function () {
      await passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, 750, 1);
      const tokenId = await passportNFT.passportIdOf(user1.address);

      await expect(
        passportNFT.connect(user1).transferFrom(user1.address, user2.address, tokenId)
      ).to.be.revertedWith("Soulbound: non-transferable");
    });

    it("Should allow minting (from address(0))", async function () {
      await expect(
        passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, 750, 1)
      ).to.emit(passportNFT, "PassportMinted");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to burn passport", async function () {
      await passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, 750, 1);
      const tokenId = await passportNFT.passportIdOf(user1.address);

      await passportNFT.connect(admin).adminBurn(user1.address);

      await expect(passportNFT.ownerOf(tokenId)).to.be.reverted;
      expect(await passportNFT.passportIdOf(user1.address)).to.equal(0);
    });

    it("Should reject burn from non-admin", async function () {
      await passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, 750, 1);

      await expect(
        passportNFT.connect(user1).adminBurn(user1.address)
      ).to.be.revertedWithCustomError(passportNFT, "AccessControlUnauthorizedAccount");
    });

    it("Should allow admin to set score updater", async function () {
      await passportNFT.connect(admin).setScoreUpdater(user2.address, true);
      expect(await passportNFT.hasRole(await passportNFT.SCORE_UPDATER_ROLE(), user2.address)).to.be.true;

      // New updater should be able to mint
      await expect(
        passportNFT.connect(user2).mintOrUpdate(user1.address, 750, 1)
      ).to.emit(passportNFT, "PassportMinted");
    });

    it("Should allow admin to revoke score updater", async function () {
      await passportNFT.connect(admin).setScoreUpdater(scoreUpdater.address, false);
      expect(await passportNFT.hasRole(await passportNFT.SCORE_UPDATER_ROLE(), scoreUpdater.address)).to.be.false;

      await expect(
        passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, 750, 1)
      ).to.be.revertedWithCustomError(passportNFT, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Multiple Users", function () {
    it("Should handle multiple users with different scores", async function () {
      await passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, 850, 1);
      await passportNFT.connect(scoreUpdater).mintOrUpdate(user2.address, 600, 2);

      const score1 = await passportNFT.getScore(user1.address);
      const score2 = await passportNFT.getScore(user2.address);

      expect(score1.score).to.equal(850);
      expect(score1.riskBand).to.equal(1);
      expect(score2.score).to.equal(600);
      expect(score2.riskBand).to.equal(2);
    });

    it("Should assign unique token IDs", async function () {
      await passportNFT.connect(scoreUpdater).mintOrUpdate(user1.address, 750, 1);
      await passportNFT.connect(scoreUpdater).mintOrUpdate(user2.address, 600, 2);

      const tokenId1 = await passportNFT.passportIdOf(user1.address);
      const tokenId2 = await passportNFT.passportIdOf(user2.address);

      expect(tokenId1).to.equal(1);
      expect(tokenId2).to.equal(2);
      expect(tokenId1).to.not.equal(tokenId2);
    });
  });
});

// Helper for matching any value in events
const anyValue = () => true;

