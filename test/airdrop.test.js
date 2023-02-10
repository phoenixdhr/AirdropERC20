const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");
const keccak256 = require("keccak256");
const { default: MerkleTree } = require("merkletreejs");

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("airdrop", () => {
  const TOKENS_IN_POOL = toWei(1000000000);
  const REWARDS_AMOUNT = toWei(500);
  let addrs;
  let contractBlockON;
  let contractBlockOFF = 70;


    const deployContracts = async() => {
    addrs = await ethers.getSigners();

    var shuffle = [];
    while (shuffle.length < 20) {
      var r = Math.floor(Math.random() * 20);
      if (shuffle.indexOf(r) == -1) {
        shuffle.push(r);
      }
    }

    // Contract Swap deploy on the Network
    const EthSwapFactory = await ethers.getContractFactory("EthSwap");
    const ethSwap = await EthSwapFactory.deploy();
    const receipt = await ethSwap.deployTransaction.wait();
    const contractBlockON = receipt.blockNumber;

    // Instantiate token
    // Token address obtiene la direccion del contrato del token creado con el contrato ethSwap
    let tokenAddress = await ethSwap.token();

    const token = (await ethers.getContractFactory("Token")).attach(
      tokenAddress
    );

    expect(await token.balanceOf(ethSwap.address)).to.equal(TOKENS_IN_POOL);

    await Promise.all(
      shuffle.map(async (i, inx) => {
        const receipt = await ethSwap
          .connect(addrs[i])
          .buyTokens({ value: toWei(10) });
        const receiptDeploy = await receipt.wait();

         expect(receipt.blockNumber).to.eq(inx + 54);
      })
    );

    const filtroWhitelist = ethSwap.filters.TokensPurchased(null, null);
    const whitelist = await ethSwap.queryFilter(
      filtroWhitelist,
      contractBlockON,
      contractBlockOFF
    );

    //Por cada tx se ejecuta en un bloque independiente

    expect(whitelist.length).to.eq(contractBlockOFF - contractBlockON);

    const wallets = whitelist.map((e) => e.args.account);

    const leaves = wallets.map((wallet) => ethers.utils.keccak256(wallet));

    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getRoot();
    const rootHex = tree.getHexRoot();

    console.log("root => ", root);
    console.log("rootHex => ", rootHex);

    const contracFactoryAirdrop = await ethers.getContractFactory("AirDrop");
    const airDrop = await contracFactoryAirdrop.deploy(root, REWARDS_AMOUNT);

    const deployed = await airDrop.deployed();
    return { addrs, shuffle, ethSwap, token, wallets, leaves, tree, root, rootHex, airDrop}

  };

  it("Solo las address elegibles puden hacer claim", async () => {
    const { addrs, shuffle, ethSwap, token, wallets, leaves, tree, root, rootHex, airDrop} = await loadFixture(deployContracts)


    for (i = 0; i < 20; i++) {
      const proof = tree.getProof(addrs[i].address);
      const proofHex = tree.getHexProof(addrs[i].address);

      if (proof.length > 0) {
        // se realiza el 1 claim
        const tx = await airDrop.connect(addrs[i]).claim(proof);
        tx.wait();

        // se realiza el 2do claim, debe revertirse
        await expect(airDrop.connect(addrs[i]).claim(proof)).to.revertedWith("Already claimed air drop")
        
        // se verifica el saldo luego de hacer claim
        expect(await airDrop.balanceOf(addrs[i].address)).to.equal(REWARDS_AMOUNT);

      } else {
        // se realiza el 1 claim, debe revertirse
        await expect(airDrop.connect(addrs[i]).claim(proof)).to.revertedWith("Incorrect merkle proof");
        
        // se verifica el saldo luego de hacer claim
        expect(await airDrop.balanceOf(addrs[i].address)).to.equal(0);
      }
    }
  });
});
