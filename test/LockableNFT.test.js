const truffleAssert = require("truffle-assertions");
const Web3 = require("web3");
const web3 = new Web3();
const LockableNFT = artifacts.require("./LockableNFT.sol");

function eventEmitted(result, eventType) {
    truffleAssert.eventEmitted(result, eventType);
    return result.logs.filter(e => e.event === eventType)[0].args;
}

contract(
    "LockableNFT",
    ([root, user1, other, dummy]) => {
        let nft;
        let authority;

        before(async () => {
            nft = await LockableNFT.new("Test", "TEST");
        });

        before(async () => {
            authority = await web3.eth.accounts.create();
            await nft.addAuthority(authority.address);
        })

        describe("add authority", () => {
            it("will add an authority", async () => {
                assert.equal(false, await nft.isAuthority(dummy));

                await nft.addAuthority(dummy);
                assert.equal(true, await nft.isAuthority(dummy));
            });

            it("can only be called by the contract owner", async () => {
                truffleAssert.reverts(
                    nft.addAuthority(dummy, { from: dummy }),
                );
            });

            it("won't add an authority twice", async () => {
                truffleAssert.reverts(
                    nft.addAuthority(authority.address),
                );
            });
        });

        describe("remove authority", () => {
            beforeEach(async () => {
                if (!(await nft.isAuthority(dummy))) {
                    await nft.addAuthority(dummy);
                }
            });

            after(async () => {
                await nft.removeAuthority(dummy);
            });

            it("will remove an authority", async () => {
                assert.equal(true, await nft.isAuthority(dummy));

                await nft.removeAuthority(dummy);
                assert.equal(false, await nft.isAuthority(dummy));
            });

            it("can only be called by the contract owner", async () => {
                truffleAssert.reverts(
                    nft.removeAuthority(dummy, { from: dummy }),
                );
            });

            it("won't remove an address that's not an authority", async () => {
                truffleAssert.reverts(
                    nft.removeAuthority(other),
                );
            });
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
                truffleAssert.eventEmitted(result, 'Lock', { tokenId });

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
                const { tokenId, challenge } = eventEmitted(await nft.mint(true, { from: user1 }), 'Lock');
                const proof = authority.sign(challenge).signature;

                const result = await nft.unlock(tokenId, proof, { from: user1 });
                truffleAssert.eventEmitted(result, 'Unlock', { tokenId });
                assert.equal(false, await nft.isLocked(tokenId));
            });

            it("requires valid proof", async () => {
                const { tokenId } = eventEmitted(await nft.mint(true, { from: user1 }), 'Transfer');

                truffleAssert.reverts(
                    nft.unlock(tokenId, 0x01, { from: user1 }),
                );
            });

            it("can only be called by the token holder", async () => {
                const { tokenId } = eventEmitted(await nft.mint(true, { from: user1 }), 'Transfer');

                truffleAssert.reverts(
                    nft.unlock(tokenId, 0x0, { from: other }),
                );
            });

            it("won't unlock a token that's already unlocked", async () => {
                const { tokenId } = eventEmitted(await nft.mint(false, { from: user1 }), 'Transfer');

                truffleAssert.reverts(
                    nft.unlock(tokenId, 0x0, { from: user1 }),
                );
            });
        });
    }
);
