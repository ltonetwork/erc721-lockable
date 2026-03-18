import { expect } from "chai";
import hre from "hardhat";
import type { ExampleLockableNFT } from "../types/ethers-contracts/index.js";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import { HDNodeWallet, Wallet, ContractTransactionResponse } from "ethers";

const { ethers } = await hre.network.connect();

async function getEventArgs(
    tx: ContractTransactionResponse,
    nft: ExampleLockableNFT,
    eventName: string,
) {
    const receipt = await tx.wait();
    for (const log of receipt?.logs ?? []) {
        try {
            const parsed = nft.interface.parseLog(log);
            if (parsed?.name === eventName) return parsed.args;
        } catch {}
    }
    throw new Error(`Event ${eventName} not found in transaction`);
}

describe("LockableNFT", () => {
    let nft: ExampleLockableNFT;
    let authority: HDNodeWallet;
    let root: HardhatEthersSigner;
    let user1: HardhatEthersSigner;
    let other: HardhatEthersSigner;
    let dummy: HardhatEthersSigner;

    before(async () => {
        [root, user1, other, dummy] = await ethers.getSigners();
        authority = Wallet.createRandom() as HDNodeWallet;
        nft = await ethers.deployContract("ExampleLockableNFT", ["Test", "TEST", authority.address, ""]) as unknown as ExampleLockableNFT;
        await nft.waitForDeployment();
    });

    describe("add authority", () => {
        it("will add an authority", async () => {
            expect(await nft.isAuthority(dummy.address)).to.equal(false);
            await nft.addAuthority(dummy.address, "");
            expect(await nft.isAuthority(dummy.address)).to.equal(true);
        });

        it("can only be called by the contract owner", async () => {
            await expect(nft.connect(dummy).addAuthority(dummy.address, "")).to.be.revert(ethers);
        });

        it("upserts base URI when called twice for the same address", async () => {
            await nft.addAuthority(authority.address, "https://new-uri.example/");
            expect(await nft.getAuthorityBaseURI(authority.address)).to.equal("https://new-uri.example/");
            expect(await nft.isAuthority(authority.address)).to.equal(true);
        });
    });

    describe("remove authority", () => {
        beforeEach(async () => {
            if (!(await nft.isAuthority(dummy.address))) {
                await nft.addAuthority(dummy.address, "");
            }
        });

        after(async () => {
            if (await nft.isAuthority(dummy.address)) {
                await nft.removeAuthority(dummy.address);
            }
        });

        it("will remove an authority", async () => {
            expect(await nft.isAuthority(dummy.address)).to.equal(true);
            await nft.removeAuthority(dummy.address);
            expect(await nft.isAuthority(dummy.address)).to.equal(false);
        });

        it("can only be called by the contract owner", async () => {
            await expect(nft.connect(dummy).removeAuthority(dummy.address)).to.be.revert(ethers);
        });

        it("won't remove an address that's not an authority", async () => {
            await expect(nft.removeAuthority(other.address)).to.be.revert(ethers);
        });
    });

    describe("mint", () => {
        it("will mint an unlocked token", async () => {
            const tx = await nft.mint(user1.address, false, "");
            const { tokenId } = await getEventArgs(tx, nft, "Transfer");

            expect(await nft.ownerOf(tokenId)).to.equal(user1.address);
            expect(await nft.isLocked(tokenId)).to.equal(false);
        });

        it("will mint a locked token", async () => {
            const tx = await nft.mint(user1.address, true, "");
            const { tokenId } = await getEventArgs(tx, nft, "Transfer");
            const lockArgs = await getEventArgs(tx, nft, "Lock");

            expect(lockArgs.tokenId).to.equal(tokenId);
            expect(await nft.ownerOf(tokenId)).to.equal(user1.address);
            expect(await nft.isLocked(tokenId)).to.equal(true);
        });
    });

    describe("lock", () => {
        it("locks a token", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, false, ""), nft, "Transfer");

            const tx = await nft.connect(user1).lock(tokenId);
            const lockArgs = await getEventArgs(tx, nft, "Lock");

            expect(lockArgs.tokenId).to.equal(tokenId);
            expect(await nft.isLocked(tokenId)).to.equal(true);
        });

        it("can only be called by the token holder", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, false, ""), nft, "Transfer");
            await expect(nft.connect(other).lock(tokenId)).to.be.revert(ethers);
        });

        it("won't lock a token that's already locked", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, true, ""), nft, "Transfer");
            await expect(nft.connect(user1).lock(tokenId)).to.be.revert(ethers);
        });
    });

    describe("unlock", () => {
        it("unlocks a token", async () => {
            const tx = await nft.mint(user1.address, true, "");
            const { tokenId, challenge } = await getEventArgs(tx, nft, "Lock");
            const proof = await authority.signMessage(ethers.getBytes(challenge));

            const unlockTx = await nft.connect(user1).unlock(tokenId, proof);
            const unlockArgs = await getEventArgs(unlockTx, nft, "Unlock");

            expect(unlockArgs.tokenId).to.equal(tokenId);
            expect(await nft.isLocked(tokenId)).to.equal(false);
            expect(await nft.ownerOf(tokenId)).to.equal(user1.address);
        });

        it("requires valid proof", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, true, ""), nft, "Transfer");
            await expect(nft.connect(user1).unlock(tokenId, "0x01")).to.be.revert(ethers);
        });

        it("reverts with invalid proof regardless of caller", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, true, ""), nft, "Transfer");
            await expect(nft.connect(other).unlock(tokenId, "0x00")).to.be.revert(ethers);
        });

        it("won't unlock a token that's already unlocked", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, false, ""), nft, "Transfer");
            await expect(nft.connect(user1).unlock(tokenId, "0x00")).to.be.revert(ethers);
        });
    });
});
