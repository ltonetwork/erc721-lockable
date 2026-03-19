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

async function signUnlockProof(
    authority: HDNodeWallet,
    nft: ExampleLockableNFT,
    tokenId: bigint,
    blockNumber: number,
): Promise<string> {
    const block = await ethers.provider.getBlock(blockNumber);
    const { chainId } = await ethers.provider.getNetwork();
    const challenge = ethers.solidityPackedKeccak256(
        ["uint256", "address", "bytes32", "uint256"],
        [chainId, await nft.getAddress(), block!.hash, tokenId],
    );
    return authority.signMessage(ethers.getBytes(challenge));
}

describe("LockableNFT", () => {
    let nft: ExampleLockableNFT;
    let authority: HDNodeWallet;
    let user1: HardhatEthersSigner;
    let other: HardhatEthersSigner;

    before(async () => {
        [, user1, other] = await ethers.getSigners();
        authority = Wallet.createRandom() as HDNodeWallet;
        nft = await ethers.deployContract("ExampleLockableNFT", ["Test", "TEST", authority.address, "https://authority.example/", 100]) as unknown as ExampleLockableNFT;
        await nft.waitForDeployment();
    });

    describe("setAuthority", () => {
        it("updates the authority address and base URI", async () => {
            await nft.setAuthority(authority.address, "https://new-uri.example/");
            expect(await nft.authority()).to.equal(authority.address);
            expect(await nft.authorityBaseURI()).to.equal("https://new-uri.example/");
        });

        it("can only be called by the contract owner", async () => {
            await expect(nft.connect(other).setAuthority(other.address, "")).to.be.revert(ethers);
        });

        it("setting authority to zero unlocks all tokens and blocks new locks", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, true), nft, "Transfer");
            expect(await nft.isLocked(tokenId)).to.equal(true);

            await nft.setAuthority(ethers.ZeroAddress, "");

            expect(await nft.isLocked(tokenId)).to.equal(false);
            await expect(nft.connect(user1).lock(tokenId)).to.be.revert(ethers);

            // restore for subsequent tests
            await nft.setAuthority(authority.address, "https://new-uri.example/");
        });
    });

    describe("mint", () => {
        it("will mint an unlocked token", async () => {
            const tx = await nft.mint(user1.address, false);
            const { tokenId } = await getEventArgs(tx, nft, "Transfer");

            expect(await nft.ownerOf(tokenId)).to.equal(user1.address);
            expect(await nft.isLocked(tokenId)).to.equal(false);
        });

        it("will mint a locked token", async () => {
            const tx = await nft.mint(user1.address, true);
            const { tokenId } = await getEventArgs(tx, nft, "Transfer");
            const lockArgs = await getEventArgs(tx, nft, "Lock");

            expect(lockArgs.tokenId).to.equal(tokenId);
            expect(await nft.ownerOf(tokenId)).to.equal(user1.address);
            expect(await nft.isLocked(tokenId)).to.equal(true);
        });
    });

    describe("lock", () => {
        it("locks a token", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, false), nft, "Transfer");

            const tx = await nft.connect(user1).lock(tokenId);
            const lockArgs = await getEventArgs(tx, nft, "Lock");

            expect(lockArgs.tokenId).to.equal(tokenId);
            expect(await nft.isLocked(tokenId)).to.equal(true);
        });

        it("can only be called by the token holder", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, false), nft, "Transfer");
            await expect(nft.connect(other).lock(tokenId)).to.be.revert(ethers);
        });

        it("won't lock a token that's already locked", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, true), nft, "Transfer");
            await expect(nft.connect(user1).lock(tokenId)).to.be.revert(ethers);
        });
    });

    describe("unlock", () => {
        it("unlocks a token", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, true), nft, "Transfer");
            const blockNumber = await ethers.provider.getBlockNumber();
            const proof = await signUnlockProof(authority, nft, tokenId, blockNumber);

            const unlockTx = await nft.connect(user1).unlock(tokenId, blockNumber, proof);
            const unlockArgs = await getEventArgs(unlockTx, nft, "Unlock");

            expect(unlockArgs.tokenId).to.equal(tokenId);
            expect(await nft.isLocked(tokenId)).to.equal(false);
            expect(await nft.ownerOf(tokenId)).to.equal(user1.address);
        });

        it("sets tokenURI from the authority's base URI", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, true), nft, "Transfer");
            const blockNumber = await ethers.provider.getBlockNumber();
            const proof = await signUnlockProof(authority, nft, tokenId, blockNumber);

            await nft.connect(user1).unlock(tokenId, blockNumber, proof);

            expect(await nft.tokenURI(tokenId)).to.equal(`https://new-uri.example/${tokenId}`);
        });

        it("requires valid proof", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, true), nft, "Transfer");
            const blockNumber = await ethers.provider.getBlockNumber();
            await expect(nft.connect(user1).unlock(tokenId, blockNumber, "0x01")).to.be.revert(ethers);
        });

        it("reverts when called by non-owner", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, true), nft, "Transfer");
            const blockNumber = await ethers.provider.getBlockNumber();
            await expect(nft.connect(other).unlock(tokenId, blockNumber, "0x00")).to.be.revert(ethers);
        });

        it("won't unlock a token that's already unlocked", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, false), nft, "Transfer");
            const blockNumber = await ethers.provider.getBlockNumber();
            await expect(nft.connect(user1).unlock(tokenId, blockNumber, "0x00")).to.be.revert(ethers);
        });

        it("reverts when proof is too old", async () => {
            const { tokenId } = await getEventArgs(await nft.mint(user1.address, true), nft, "Transfer");
            await expect(nft.connect(user1).unlock(tokenId, 0, "0x00")).to.be.revert(ethers);
        });
    });
});
