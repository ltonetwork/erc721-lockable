const truffleAssert = require("truffle-assertions");
const Web3 = require("web3");
const LockableNFT = artifacts.require("./LockableNFT.sol");

function eventEmitted(result, eventType) {
    truffleAssert.eventEmitted(result, eventType);
    return result.logs.filter(e => e.event === eventType)[0].args;
}

contract(
    "LockableNFT",
    ([root, user1, other]) => {
        let nft;

        before(async () => {
            nft = await LockableNFT.new("Test", "TEST");
        });

        describe("mint", () => {
            it("will mint an unlocked token", async () => {
                const result = await nft.mint(false, { from: user1 });
                const { tokenId } = eventEmitted(result, 'Transfer');

                assert.equal(user1, await nft.ownerOf(tokenId));
                assert.equal(false, await nft.isLocked(tokenId));
            });

            it("will mint a locked token", async () => {
                const result = await nft.mint(true, { from: user1 });
                const { tokenId } = eventEmitted(result, 'Transfer');

                assert.equal(user1, await nft.ownerOf(tokenId));
                assert.equal(true, await nft.isLocked(tokenId));
            });
        });

        describe("lock", () => {
            it("locks a token", async () => {
                const { tokenId } = eventEmitted(await nft.mint(false, { from: user1 }), 'Transfer');

                const result = await nft.lock(tokenId, { from: user1 });
                truffleAssert.eventEmitted(result, 'Lock', { tokenId });
                assert.equal(true, await nft.isLocked(tokenId));
            });

            it("can only be called by the token holder", async () => {
                const { tokenId } = eventEmitted(await nft.mint(false, { from: user1 }), 'Transfer');

                truffleAssert.reverts(
                    nft.lock(tokenId, { from: other })
                );
            });

            it("won't lock a token that's already locked", async () => {
                const { tokenId } = eventEmitted(await nft.mint(true, { from: user1 }), 'Transfer');

                truffleAssert.reverts(
                    nft.lock(tokenId, { from: user1 }),
                );
            });
        });

        describe("unlock", () => {
            it("unlocks a token", async () => {
                const { tokenId } = eventEmitted(await nft.mint(true, { from: user1 }), 'Transfer');

                const result = await nft.unlock(tokenId, { from: user1 });
                truffleAssert.eventEmitted(result, 'Unlock', { tokenId });
                assert.equal(false, await nft.isLocked(tokenId));
            });

            it("can only be called by the token holder", async () => {
                const { tokenId } = eventEmitted(await nft.mint(true, { from: user1 }), 'Transfer');

                truffleAssert.reverts(
                    nft.unlock(tokenId, { from: other }),
                );
            });

            it("won't unlock a token that's already unlocked", async () => {
                const { tokenId } = eventEmitted(await nft.mint(false, { from: user1 }), 'Transfer');

                truffleAssert.reverts(
                    nft.unlock(tokenId, { from: user1 }),
                );
            });
        });
    }
);
