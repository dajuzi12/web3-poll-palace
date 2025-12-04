import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, Contract, ethers } from 'ethers';
import { toast } from 'sonner';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeAllListeners: (event: string) => void;
    };
  }
}

interface Web3ContextType {
  account: string | null;
  provider: BrowserProvider | null;
  contract: Contract | null;
  chainId: number | null;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// FHE-enabled contract ABI (based on AnonVoteFHE contract)
const CONTRACT_ABI = [
  // Create vote
  "function createVote(string memory title, string memory description, string[] memory options, uint256 deadline) external returns (uint256)",

  // Cast encrypted vote
  "function castVote(uint256 voteId, bytes calldata encryptedChoice) external",

  // View functions
  "function hasAddressVoted(uint256 voteId, address addr) external view returns (bool)",
  "function getVoteResults(uint256 voteId) external view returns (uint256[] memory)",
  "function getVoteInfo(uint256 voteId) external view returns (string memory title, string memory description, string[] memory options, uint256 deadline, uint256 totalVoters, bool isActive, bool isRevealed, address creator)",
  "function getTotalVotes() external view returns (uint256)",
  "function isVoteExpired(uint256 voteId) external view returns (bool)",

  // Admin functions
  "function endVoteEarly(uint256 voteId) external",
  "function revealVoteResults(uint256 voteId, uint256[] calldata decryptedCounts) external",

  // Storage
  "function nextVoteId() external view returns (uint256)",

  // Events
  "event VoteCreated(uint256 indexed voteId, address indexed creator, string title, uint256 deadline)",
  "event VoteCast(uint256 indexed voteId, address indexed voter, uint256 choiceIndex, string choiceName)",
  "event VoteRevealed(uint256 indexed voteId, uint256[] counts)"
];

// Deployed contract address on Sepolia testnet
const CONTRACT_ADDRESS = "0xe1C8019F2c8B3560246A3d4f79969Fc5C458824f";

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const connectWallet = async (silent = false) => {
    if (typeof window.ethereum === 'undefined') {
      if (!silent) {
        toast.error('Please install MetaMask wallet');
      }
      return;
    }

    try {
      setConnecting(true);
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();

      setAccount(accounts[0]);
      setProvider(browserProvider);
      setChainId(Number(network.chainId));

      // Initialize contract instance
      const signer = await browserProvider.getSigner();
      const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);

      // Store connection state in localStorage
      localStorage.setItem('walletConnected', 'true');

      if (!silent) {
        toast.success('Wallet connected successfully');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      if (!silent) {
        toast.error('Failed to connect wallet');
      }
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setContract(null);
    setChainId(null);

    // Clear connection state from localStorage
    localStorage.removeItem('walletConnected');

    toast.info('Wallet disconnected');
  };

  // Auto-reconnect on page load
  useEffect(() => {
    const autoConnect = async () => {
      if (isInitialized) return;

      const wasConnected = localStorage.getItem('walletConnected');
      if (wasConnected === 'true' && typeof window.ethereum !== 'undefined') {
        try {
          // Check if wallet is still connected
          const browserProvider = new BrowserProvider(window.ethereum);
          const accounts = await browserProvider.send('eth_accounts', []);

          if (accounts && accounts.length > 0) {
            // Silently reconnect
            await connectWallet(true);
            console.log('[Web3] Auto-reconnected to wallet');
          } else {
            // Clear stale connection state
            localStorage.removeItem('walletConnected');
          }
        } catch (error) {
          console.error('[Web3] Auto-reconnect failed:', error);
          localStorage.removeItem('walletConnected');
        }
      }

      setIsInitialized(true);
    };

    autoConnect();
  }, [isInitialized]);

  // Listen for account and network changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          // Update contract instance with new signer
          if (provider) {
            try {
              const signer = await provider.getSigner();
              const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
              setContract(contractInstance);
            } catch (error) {
              console.error('Failed to update contract instance:', error);
            }
          }
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [provider]);

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        contract,
        chainId,
        connecting,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
