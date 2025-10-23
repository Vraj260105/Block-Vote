// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VotingSystem {
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
    }

    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public owner;
    mapping(address => Voter) public voters;
    Candidate[] public candidates;
    bool public votingOpen;

    event VoterRegistered(address indexed voter);
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event VotingOpened();
    event VotingClosed();

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyRegistered() {
        require(voters[msg.sender].isRegistered, "Not registered");
        _;
    }

    modifier whenVotingOpen() {
        require(votingOpen, "Voting is closed");
        _;
    }

    constructor() {
        owner = msg.sender;
        votingOpen = false;
    }

    // Admin functions
    function registerVoter(address _voter) external onlyOwner {
        require(!voters[_voter].isRegistered, "Already registered");
        voters[_voter].isRegistered = true;
        emit VoterRegistered(_voter);
    }

    function addCandidate(string memory _name) external onlyOwner {
        require(bytes(_name).length > 0, "Name required");
        candidates.push(Candidate({name: _name, voteCount: 0}));
        emit CandidateAdded(candidates.length - 1, _name);
    }

    function openVoting() external onlyOwner {
        require(!votingOpen, "Already open");
        require(candidates.length > 0, "No candidates");
        votingOpen = true;
        emit VotingOpened();
    }

    function closeVoting() external onlyOwner {
        require(votingOpen, "Not open");
        votingOpen = false;
        emit VotingClosed();
    }

    // Convenience for demo: self-registration by voter
    function registerSelf() external {
        require(!voters[msg.sender].isRegistered, "Already registered");
        voters[msg.sender].isRegistered = true;
        emit VoterRegistered(msg.sender);
    }

    // Voter function
    function castVote(uint256 _candidateId) external onlyRegistered whenVotingOpen {
        require(_candidateId < candidates.length, "Invalid candidate");
        Voter storage v = voters[msg.sender];
        require(!v.hasVoted, "Already voted");
        v.hasVoted = true;
        v.votedCandidateId = _candidateId;
        candidates[_candidateId].voteCount += 1;
        emit VoteCast(msg.sender, _candidateId);
    }

    // Read helpers
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 _candidateId) external view returns (string memory name, uint256 votes) {
        require(_candidateId < candidates.length, "Invalid candidate");
        Candidate storage c = candidates[_candidateId];
        return (c.name, c.voteCount);
    }

    function getResults() external view returns (string[] memory names, uint256[] memory votes) {
        uint256 len = candidates.length;
        names = new string[](len);
        votes = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            names[i] = candidates[i].name;
            votes[i] = candidates[i].voteCount;
        }
    }
}