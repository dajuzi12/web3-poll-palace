const hre = require("hardhat");

async function main() {
  console.log("Deploying AnonVoteFHE contract to Sepolia...");

  // Get the contract factory
  const AnonVoteFHE = await hre.ethers.getContractFactory("AnonVoteFHE");

  // Deploy the contract
  console.log("Deployment in progress...");
  const contract = await AnonVoteFHE.deploy();

  // Wait for deployment to complete
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("\n========================================");
  console.log("✅ Contract deployed successfully!");
  console.log("========================================");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Sepolia Testnet");
  console.log("Explorer URL:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log("========================================\n");

  console.log("Next steps:");
  console.log("1. Update CONTRACT_ADDRESS in src/contexts/Web3Context.tsx");
  console.log(`   const CONTRACT_ADDRESS = "${contractAddress}";`);
  console.log("2. Verify the contract on Etherscan (optional):");
  console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
  console.log("3. Start the frontend: npm run dev");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
