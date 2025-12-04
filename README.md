# VoteChain - Decentralized Private Voting Platform

A blockchain-based privacy-protected voting system using **Fully Homomorphic Encryption (FHE)** technology powered by Zama's fhEVM.

## 🌟 Features

### Privacy Protection
- **FHE Technology**: Based on Zama's Fully Homomorphic Encryption, ensuring completely anonymous voting
- **Encrypted Storage**: All votes are encrypted and stored on-chain
- **Zero-Knowledge Proofs**: Vote submission includes cryptographic proofs without revealing content

### Security & Reliability
- **Blockchain Immutability**: All voting records are permanently stored on-chain and cannot be modified
- **Smart Contract Automation**: No centralized servers, ensuring transparent voting process
- **Access Control**: Fine-grained permission management for encrypted data

### User Experience
- **Auto-Reconnect**: Wallet automatically reconnects after page refresh
- **Real-time Statistics**: View live vote counts in demo mode
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Loading States**: Clear feedback during encryption and submission

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful component library
- **Zama SDK 0.2.0** - FHE encryption SDK
- **ethers.js v6** - Ethereum interactions

### Smart Contracts
- **Solidity ^0.8.24**
- **Zama fhEVM** - FHE-enabled EVM
- **OpenZeppelin** - Security standards
- **TFHE Library** - Homomorphic encryption operations

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application will run at `http://localhost:5173`

## 🔐 FHE Integration

### How It Works

```
User Browser (React + Zama SDK)
    │ 1. Encrypt vote using FHE
    │ 2. Generate zero-knowledge proof
    ↓
Blockchain Smart Contract
    │ 3. Store encrypted votes (euint32)
    │ 4. Perform FHE operations
    ↓
Zama Gateway
    │ 5. Decrypt results (when authorized)
    ↓
Return to Contract
```

### Key Features

- **Client-Side Encryption**: Votes encrypted in user's browser before submission
- **On-Chain Privacy**: Encrypted data stored and computed on blockchain
- **Homomorphic Operations**: Calculate on encrypted data without decryption
- **Controlled Decryption**: Results revealed only after voting deadline

## 🎯 Usage Guide

### For Voters

1. Connect your MetaMask wallet
2. Browse available polls (All / Active / Ended)
3. Select a poll and choose your preferred option
4. Click "Submit Vote" - your vote is automatically encrypted
5. Confirm the transaction
6. ✅ Your encrypted vote is now on-chain!

### For Poll Creators

1. Click "Create New Poll"
2. Fill in poll details (title, description, options, deadline)
3. Submit and confirm transaction
4. Manage your poll and view real-time statistics

## 📁 Project Structure

```
web3-poll-palace/
├── src/
│   ├── components/        # UI components
│   ├── contexts/          # Web3 & FHE contexts
│   ├── hooks/             # Custom React hooks
│   │   └── useFHE.ts     # FHE instance management
│   ├── pages/             # Application pages
│   ├── utils/             # Utility functions
│   │   └── fhe.ts        # FHE encryption utilities
│   └── lib/               # Libraries
├── contracts/             # Smart contracts
│   └── index.sol         # AnonVoteFHE contract
└── public/                # Static assets
```

## 🔧 Key Files

### FHE Utilities (`src/utils/fhe.ts`)
Core FHE encryption functions:
- `initializeFHE()` - Initialize Zama SDK
- `encryptVote()` - Encrypt vote choices
- `encryptUint32()` - Encrypt 32-bit integers

### FHE Hook (`src/hooks/useFHE.ts`)
React hook for FHE instance management:
- Automatic initialization
- Network change handling
- Error handling

### Smart Contract (`contracts/index.sol`)
FHE-enabled voting contract:
- `createVote()` - Create new poll
- `castVote()` - Submit encrypted vote
- `getVoteResults()` - Get vote statistics
- `revealVoteResults()` - Decrypt final results

## 🛡️ Security Features

- **Access Control Lists (ACL)** for encrypted data
- **Reentrancy protection** on all state-changing functions
- **Input validation** with zero-knowledge proof verification
- **Checksum address validation** (EIP-55)
- **Double-voting prevention**
- **Secure wallet reconnection** - No private keys stored in localStorage

## 📚 Documentation

- **[FHE Complete Guide](./FHE_COMPLETE_GUIDE_FULL_CN.md)** - Comprehensive FHE development guide (Chinese)
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[Wallet Auto-Reconnect](./WALLET_AUTO_RECONNECT.md)** - Auto-reconnect feature documentation
- **[Zama fhEVM Documentation](https://docs.zama.ai/fhevm)** - Official Zama docs
- **[Smart Contract](./contracts/index.sol)** - Full contract source code

## 🚀 Demo Mode vs Production Mode

### Demo Mode (Current)
- Simulates FHE encryption flow
- Uses placeholder contract address
- Real-time vote counting
- No actual blockchain transactions

### Production Mode
To enable production mode:
1. Deploy the smart contract to Sepolia/Mainnet
2. Update `CONTRACT_ADDRESS` in `src/contexts/Web3Context.tsx`
3. Configure network settings
4. Your votes will be encrypted and stored on-chain!

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- **[Zama](https://zama.ai/)** - FHE technology
- **[fhEVM](https://github.com/zama-ai/fhevm)** - FHE for EVM
- **[shadcn/ui](https://ui.shadcn.com/)** - UI components
- **[OpenZeppelin](https://openzeppelin.com/)** - Security standards

---

**Built with ❤️ using Zama FHE Technology**
