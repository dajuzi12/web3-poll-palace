import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to resolve imports
function findImports(importPath) {
  try {
    let resolvedPath;

    if (importPath.startsWith('@openzeppelin/')) {
      // Resolve OpenZeppelin imports from node_modules
      resolvedPath = path.join(__dirname, 'node_modules', importPath);
    } else {
      resolvedPath = path.join(__dirname, 'contracts', importPath);
    }

    const contents = fs.readFileSync(resolvedPath, 'utf8');
    return { contents };
  } catch (error) {
    return { error: 'File not found: ' + importPath };
  }
}

async function main() {
  console.log("Deploying AnonVoteFHE contract to Sepolia...\n");

  // Read the contract source code
  const contractSource = fs.readFileSync('./contracts/AnonVoteFHE.sol', 'utf8');

  // Prepare input for Solidity compiler
  const input = {
    language: 'Solidity',
    sources: {
      'AnonVoteFHE.sol': {
        content: contractSource
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };

  console.log("Compiling contract...");

  // Compile the contract with import callback
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  // Check for errors
  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error("Compilation errors:");
      errors.forEach(err => console.error(err.formattedMessage));
      process.exit(1);
    }
  }

  const contract = output.contracts['AnonVoteFHE.sol']['AnonVoteFHE'];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  console.log("✅ Contract compiled successfully!\n");

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
  const privateKey = '0xb3b60da356058ac9901c437dfd280b0b68ecaacb347314f0bb47f9ccaacfb8c4';
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deployer address:", wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    console.error("❌ Error: Insufficient balance. Please fund your wallet with Sepolia ETH.");
    console.log("Get Sepolia ETH from: https://sepoliafaucet.com/");
    process.exit(1);
  }

  // Deploy the contract
  console.log("Deploying contract to Sepolia...");
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contractInstance = await factory.deploy();

  console.log("Waiting for deployment transaction to be mined...");
  await contractInstance.waitForDeployment();

  const contractAddress = await contractInstance.getAddress();

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
  console.log("2. Start the frontend: npm run dev");
  console.log("3. Connect your wallet and create polls!");

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: "sepolia",
    chainId: 11155111,
    deployedAt: new Date().toISOString(),
    deployer: wallet.address,
    abi: abi
  };

  fs.writeFileSync(
    './deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n✅ Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
