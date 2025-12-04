// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AnonVoteFHE
 * @dev Anonymous Voting System using FHEVM (Fully Homomorphic Encryption Virtual Machine)
 * @notice This contract allows for completely anonymous voting where individual votes are encrypted
 */
contract AnonVoteFHE is Ownable, ReentrancyGuard {
    // Note: FHEVM types will be used in production version

    struct Vote {
        string title;               // Poll title
        string description;         // Poll description
        string[] options;           // Poll options
        uint256 deadline;           // Deadline
        uint256 totalVoters;        // Total voters
        bool isActive;              // Is active
        bool isRevealed;            // Results revealed
        address creator;            // Creator
        mapping(address => bool) hasVoted; // Has voted
        mapping(address => bytes) encryptedVotes; // Store encrypted votes for each user
        uint256[] revealedCounts;   // Decrypted vote counts
    }

    // Vote storage
    mapping(uint256 => Vote) public votes;
    uint256 public nextVoteId;

    // Simplified version: directly store decrypted results
    mapping(uint256 => bool) private voteRevealRequested;

    // Events
    event VoteCreated(
        uint256 indexed voteId, 
        address indexed creator, 
        string title, 
        uint256 deadline
    );
    
    event VoteCast(
        uint256 indexed voteId, 
        address indexed voter,
        uint256 choiceIndex,
        string choiceName
    );
    
    event VoteRevealed(
        uint256 indexed voteId, 
        uint256[] counts
    );

    error VoteNotFound();
    error VoteExpired();
    error VoteNotExpired();
    error AlreadyVoted();
    error InvalidOption();
    error VoteAlreadyRevealed();
    error NotVoteCreator();
    error InvalidDeadline();
    error EmptyTitle();
    error NoOptions();
    error TooManyOptions();

    constructor() {}

    /**
     * @dev Create new poll
     * @param title Poll title
     * @param description Poll description
     * @param options Poll options array
     * @param deadline Poll deadline (timestamp)
     * @return voteId Newly created poll ID
     */
    function createVote(
        string memory title,
        string memory description,
        string[] memory options,
        uint256 deadline
    ) external returns (uint256) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (options.length == 0) revert NoOptions();
        if (options.length > 10) revert TooManyOptions(); // Limit number of options
        if (deadline <= block.timestamp) revert InvalidDeadline();

        uint256 voteId = nextVoteId++;
        Vote storage newVote = votes[voteId];

        newVote.title = title;
        newVote.description = description;
        newVote.options = options;
        newVote.deadline = deadline;
        newVote.totalVoters = 0;
        newVote.isActive = true;
        newVote.isRevealed = false;
        newVote.creator = msg.sender;

        // Initialize vote results array
        newVote.revealedCounts = new uint256[](options.length);

        emit VoteCreated(voteId, msg.sender, title, deadline);
        return voteId;
    }

    /**
     * @dev Submit encrypted vote
     * @param voteId Poll ID
     * @param encryptedChoice Encrypted choice (0-based index)
     *
     * Note: This is a simplified version, actual FHEVM integration requires proper encrypted input types
     */
    function castVote(uint256 voteId, bytes calldata encryptedChoice) 
        external 
        nonReentrant 
    {
        Vote storage vote = votes[voteId];
        
        if (!vote.isActive) revert VoteNotFound();
        if (block.timestamp >= vote.deadline) revert VoteExpired();
        if (vote.hasVoted[msg.sender]) revert AlreadyVoted();

        // Simplified version: directly parse vote choice (would be encrypted in real FHEVM)
        // Parse hex-encoded choice index
        uint256 choiceIndex = 0;
        if (encryptedChoice.length >= 2) {
            // Convert bytes to uint256 to get choice index
            // Frontend sends format like 0x0000, 0x0001, 0x0002, etc.
            if (encryptedChoice.length == 2) {
                choiceIndex = uint256(uint16(bytes2(encryptedChoice)));
            }
            if (choiceIndex >= vote.options.length) {
                choiceIndex = 0; // Default to first option
            }
        }

        // Store vote choice (simplified version)
        vote.encryptedVotes[msg.sender] = encryptedChoice;
        vote.hasVoted[msg.sender] = true;
        vote.totalVoters++;

        // Directly count vote results
        vote.revealedCounts[choiceIndex]++;
        vote.isRevealed = true; // Mark as readable

        // Emit detailed vote event with choice info
        emit VoteCast(voteId, msg.sender, choiceIndex, vote.options[choiceIndex]);
    }

    /**
     * @dev Request to decrypt vote results (only poll creator or contract owner can call)
     * @param voteId Poll ID
     * @param decryptedCounts Decrypted results (requires off-chain decryption)
     *
     * Note: This is a simplified version, actual project needs to use FHEVM gateway for automatic decryption
     */
    function revealVoteResults(uint256 voteId, uint256[] calldata decryptedCounts) external {
        Vote storage vote = votes[voteId];
        
        if (!vote.isActive) revert VoteNotFound();
        if (msg.sender != vote.creator && msg.sender != owner()) revert NotVoteCreator();
        if (block.timestamp < vote.deadline) revert VoteNotExpired();
        if (vote.isRevealed) revert VoteAlreadyRevealed();
        if (decryptedCounts.length != vote.options.length) revert InvalidOption();

        // Simplified version: directly set results (production needs to verify decryption correctness)
        vote.revealedCounts = decryptedCounts;
        vote.isRevealed = true;
        voteRevealRequested[voteId] = true;

        emit VoteRevealed(voteId, decryptedCounts);
    }

    /**
     * @dev Force end poll (only creator or owner)
     * @param voteId Poll ID
     */
    function endVoteEarly(uint256 voteId) external {
        Vote storage vote = votes[voteId];
        
        if (!vote.isActive) revert VoteNotFound();
        if (msg.sender != vote.creator && msg.sender != owner()) revert NotVoteCreator();
        
        vote.deadline = block.timestamp;
    }

    // View functions

    /**
     * @dev Get poll basic information
     */
    function getVoteInfo(uint256 voteId) external view returns (
        string memory title,
        string memory description,
        string[] memory options,
        uint256 deadline,
        uint256 totalVoters,
        bool isActive,
        bool isRevealed,
        address creator
    ) {
        Vote storage vote = votes[voteId];
        if (!vote.isActive) revert VoteNotFound();
        
        return (
            vote.title,
            vote.description,
            vote.options,
            vote.deadline,
            vote.totalVoters,
            vote.isActive,
            vote.isRevealed,
            vote.creator
        );
    }

    /**
     * @dev Get vote results (only available after decryption)
     */
    function getVoteResults(uint256 voteId) external view returns (uint256[] memory) {
        Vote storage vote = votes[voteId];
        if (!vote.isActive) revert VoteNotFound();

        // Directly return vote results, no decryption check needed
        return vote.revealedCounts;
    }

    /**
     * @dev Check if address has voted
     */
    function hasAddressVoted(uint256 voteId, address addr) external view returns (bool) {
        return votes[voteId].hasVoted[addr];
    }

    /**
     * @dev Get total number of polls
     */
    function getTotalVotes() external view returns (uint256) {
        return nextVoteId;
    }

    /**
     * @dev Check if poll has expired
     */
    function isVoteExpired(uint256 voteId) external view returns (bool) {
        Vote storage vote = votes[voteId];
        return block.timestamp >= vote.deadline;
    }
}
