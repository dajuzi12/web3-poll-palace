require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: "https://rpc.sepolia.org",
      accounts: ["0xb3b60da356058ac9901c437dfd280b0b68ecaacb347314f0bb47f9ccaacfb8c4"],
      chainId: 11155111
    }
  }
};
