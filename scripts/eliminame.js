const { ethers } = require("hardhat");
const keccak256 = require("keccak256");
const { default: MerkleTree } = require("merkletreejs");

main = async () => {
  const wallets = [
    "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
    "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
  ];

  const walletsKeccakBuffer = wallets.map((e) => keccak256(e));
//   console.log(walletsKeccakBuffer);

  const walletsKeccak = wallets.map((e) => ethers.utils.keccak256(e));
//   console.log(walletsKeccak);

  const treeBuffer = new MerkleTree(walletsKeccakBuffer, keccak256, {
    sortPairs: true,
  });

  const rootBuffer = treeBuffer.getRoot();

  console.log(rootBuffer);

  const tree = new MerkleTree(walletsKeccak, keccak256, {
    sortPairs: true,
  });

  const root = treeBuffer.getRoot();

  console.log(root);
};

main();
