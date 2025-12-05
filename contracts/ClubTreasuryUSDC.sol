// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal ERC20 interface for USDC
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
}

/**
 * @title ClubTreasuryUSDC
 * @notice Single-club treasury using USDC on Base, with:
 *  - Admins & members (role system)
 *  - Voting power modes (one-person-one-vote, fixed weights, attendance-weighted)
 *  - Proposals for funding & voting-config changes
 *  - Attendance logging via random codes (stored as hashes)
 */
contract ClubTreasuryUSDC {
    // ------------------ Events ------------------

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);

    event VotingModeInitialized(VotingMode mode, uint8 templateId);
    event VotingModeChanged(VotingMode newMode, uint8 templateId);

    event DepositUSDC(address indexed from, uint256 amount);

    event ProposalCreated(
        uint256 indexed proposalId,
        ProposalType proposalType,
        string title
    );
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalExecuted(uint256 indexed proposalId);

    event EventCreated(
        uint256 indexed eventId,
        string name,
        uint256 startTime,
        uint256 endTime
    );
    event EventActiveToggled(uint256 indexed eventId, bool active);
    event CheckedIn(uint256 indexed eventId, address indexed member);

    // ------------------ Roles & Members ------------------

    mapping(address => bool) public isAdmin;
    mapping(address => bool) public isMember;
    address[] public members; // used to recompute voting power

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not admin");
        _;
    }

    modifier onlyMember() {
        require(isMember[msg.sender], "Not member");
        _;
    }

    // ------------------ Voting Power ------------------

    enum VotingMode {
        ONE_PERSON_ONE_VOTE,
        FIXED_WEIGHTS,
        ATTENDANCE_WEIGHTED
    }

    VotingMode public currentVotingMode;
    bool public votingModeInitialized;

    // Voting power per member (weight of their vote)
    mapping(address => uint256) public votingPower;
    uint256 public totalVotingPower;

    // ------------------ Proposals ------------------

    enum ProposalType {
        FUNDING,
        VOTING_CONFIG_CHANGE
    }

    struct FundingDetails {
        address recipient; // no need to be payable for ERC20
        uint256 amountUSDC;
    }

    struct VotingConfigDetails {
        VotingMode newMode;
        uint8 templateId; // index into a predefined set of templates
    }

    struct Proposal {
        ProposalType proposalType;
        string title;
        string descriptionURI;
        uint256 createdAt;
        uint256 deadline;
        uint256 yesWeight;
        uint256 noWeight;
        bool executed;
        FundingDetails funding;
        VotingConfigDetails votingConfig;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // ------------------ Attendance ------------------

    struct Event {
        string name;
        uint256 startTime;
        uint256 endTime;
        bool active;
        bytes32 attendanceCodeHash; // keccak256(code + salt)
    }

    uint256 public eventCount;
    mapping(uint256 => Event) public events;
    mapping(uint256 => mapping(address => bool)) public attended;
    mapping(address => uint256) public attendanceCount;

    // ------------------ Treasury (USDC) ------------------

    IERC20 public immutable usdc;

    // ------------------ Constructor ------------------

    /**
     * @param _usdc Address of USDC token on Base
     * @param initialAdmins Array of additional admins besides deployer
     */
    constructor(address _usdc, address[] memory initialAdmins) {
        require(_usdc != address(0), "USDC zero address");
        usdc = IERC20(_usdc);

        // Deployer is admin & member
        isAdmin[msg.sender] = true;
        emit AdminAdded(msg.sender);
        _addMemberInternal(msg.sender);

        // Additional admins
        for (uint256 i = 0; i < initialAdmins.length; i++) {
            address admin = initialAdmins[i];
            if (admin == address(0) || isAdmin[admin]) continue;
            isAdmin[admin] = true;
            emit AdminAdded(admin);
            _addMemberInternal(admin);
        }
    }

    // ------------------ Internal helpers ------------------

    function _addMemberInternal(address account) internal {
        if (!isMember[account]) {
            isMember[account] = true;
            members.push(account);
            emit MemberAdded(account);

            // Initialize voting power if mode already set
            if (votingModeInitialized) {
                _setVotingPowerForMember(account);
            }
        }
    }

    function _removeMemberInternal(address account) internal {
        if (isMember[account]) {
            isMember[account] = false;
            emit MemberRemoved(account);

            // zero their voting power
            uint256 oldPower = votingPower[account];
            if (oldPower > 0) {
                totalVotingPower -= oldPower;
                votingPower[account] = 0;
            }
        }
    }

    function _setVotingPowerForMember(address account) internal {
        // Clear old power
        uint256 oldPower = votingPower[account];
        if (oldPower > 0) {
            totalVotingPower -= oldPower;
        }

        if (!isMember[account]) {
            votingPower[account] = 0;
            return;
        }

        uint256 newPower = 0;

        if (currentVotingMode == VotingMode.ONE_PERSON_ONE_VOTE) {
            newPower = 1;
        } else if (currentVotingMode == VotingMode.FIXED_WEIGHTS) {
            // Example template: admins = 3, non-admin members = 1
            // (can extend with templateId, but we keep logic simple and deterministic here)
            if (isAdmin[account]) {
                newPower = 3;
            } else {
                newPower = 1;
            }
        } else if (currentVotingMode == VotingMode.ATTENDANCE_WEIGHTED) {
            // Example rule: 1 base + attendanceCount
            newPower = 1 + attendanceCount[account];
        }

        votingPower[account] = newPower;
        totalVotingPower += newPower;
    }

    function _recomputeAllVotingPower() internal {
        totalVotingPower = 0;
        for (uint256 i = 0; i < members.length; i++) {
            address m = members[i];
            if (!isMember[m]) {
                votingPower[m] = 0;
                continue;
            }
            uint256 oldPower = votingPower[m];
            if (oldPower > 0) {
                votingPower[m] = 0;
            }
            _setVotingPowerForMember(m);
        }
    }

    // ------------------ Admin & Member Management ------------------

    function addAdmin(address account) external onlyAdmin {
        require(account != address(0), "Zero address");
        require(!isAdmin[account], "Already admin");
        isAdmin[account] = true;
        emit AdminAdded(account);
        _addMemberInternal(account);
    }

    function removeAdmin(address account) external onlyAdmin {
        require(account != msg.sender, "Cannot remove self");
        require(isAdmin[account], "Not admin");
        isAdmin[account] = false;
        emit AdminRemoved(account);
        // they may remain a member; up to club to remove separately
    }

    function addMember(address account) external onlyAdmin {
        require(account != address(0), "Zero address");
        _addMemberInternal(account);
    }

    function removeMember(address account) external onlyAdmin {
        require(isMember[account], "Not member");
        _removeMemberInternal(account);
    }

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    // ------------------ Voting Mode Initialization & Changes ------------------

    /**
     * @notice Initialize voting mode once, chosen by admins.
     * @dev templateId is reserved for future more complex templates, but
     *      current implementation uses a single built-in rule for FIXED_WEIGHTS.
     */
    function setInitialVotingMode(
        VotingMode mode,
        uint8 templateId
    ) external onlyAdmin {
        require(!votingModeInitialized, "Voting mode already initialized");
        currentVotingMode = mode;
        votingModeInitialized = true;

        // (templateId not used in this minimal implementation, but stored in events)
        emit VotingModeInitialized(mode, templateId);

        _recomputeAllVotingPower();
    }

    // ------------------ Treasury (USDC) ------------------

    /**
     * @notice Deposit USDC into the club treasury.
     * @dev User must `approve` this contract for `amount` first.
     */
    function depositUSDC(uint256 amount) external {
        require(amount > 0, "Amount = 0");
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");
        emit DepositUSDC(msg.sender, amount);
    }

    function treasuryBalanceUSDC() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    // ------------------ Proposals ------------------

    function createFundingProposal(
        string calldata title,
        string calldata descriptionURI,
        address recipient,
        uint256 amountUSDC,
        uint256 duration
    ) external onlyAdmin returns (uint256) {
        require(amountUSDC > 0, "Amount must be > 0");
        require(duration > 0, "Duration must be > 0");

        uint256 id = ++proposalCount;

        Proposal storage p = proposals[id];
        p.proposalType = ProposalType.FUNDING;
        p.title = title;
        p.descriptionURI = descriptionURI;
        p.createdAt = block.timestamp;
        p.deadline = block.timestamp + duration;
        p.funding = FundingDetails({recipient: recipient, amountUSDC: amountUSDC});

        emit ProposalCreated(id, ProposalType.FUNDING, title);
        return id;
    }

    function createVotingConfigProposal(
        string calldata title,
        string calldata descriptionURI,
        VotingMode newMode,
        uint8 templateId,
        uint256 duration
    ) external onlyAdmin returns (uint256) {
        require(duration > 0, "Duration must be > 0");

        uint256 id = ++proposalCount;
        Proposal storage p = proposals[id];
        p.proposalType = ProposalType.VOTING_CONFIG_CHANGE;
        p.title = title;
        p.descriptionURI = descriptionURI;
        p.createdAt = block.timestamp;
        p.deadline = block.timestamp + duration;
        p.votingConfig = VotingConfigDetails({newMode: newMode, templateId: templateId});

        emit ProposalCreated(id, ProposalType.VOTING_CONFIG_CHANGE, title);
        return id;
    }

    function vote(uint256 proposalId, bool support) external onlyMember {
        require(votingModeInitialized, "Voting mode not initialized");
        Proposal storage p = proposals[proposalId];
        require(p.createdAt != 0, "Proposal does not exist");
        require(block.timestamp < p.deadline, "Voting period over");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        uint256 weight = votingPower[msg.sender];
        require(weight > 0, "No voting power");

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            p.yesWeight += weight;
        } else {
            p.noWeight += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);
    }

    function execute(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.createdAt != 0, "Proposal does not exist");
        require(!p.executed, "Already executed");
        require(block.timestamp >= p.deadline, "Voting still active");
        require(p.yesWeight > p.noWeight, "Proposal did not pass");

        p.executed = true;

        if (p.proposalType == ProposalType.FUNDING) {
            _executeFundingProposal(p);
        } else if (p.proposalType == ProposalType.VOTING_CONFIG_CHANGE) {
            _executeVotingConfigChange(p);
        }

        emit ProposalExecuted(proposalId);
    }

    function _executeFundingProposal(Proposal storage p) internal {
        uint256 amount = p.funding.amountUSDC;
        address recipient = p.funding.recipient;
        require(recipient != address(0), "Invalid recipient");
        uint256 balance = usdc.balanceOf(address(this));
        require(balance >= amount, "Insufficient USDC balance");

        bool success = usdc.transfer(recipient, amount);
        require(success, "USDC transfer failed");
    }

    function _executeVotingConfigChange(Proposal storage p) internal {
        currentVotingMode = p.votingConfig.newMode;
        // templateId is reserved for more complex templates;
        // we currently hardcode rules in _setVotingPowerForMember
        _recomputeAllVotingPower();
        emit VotingModeChanged(currentVotingMode, p.votingConfig.templateId);
    }

    // ------------------ Attendance ------------------

    function createEvent(
        string calldata name,
        uint256 startTime,
        uint256 endTime,
        bytes32 attendanceCodeHash
    ) external onlyAdmin returns (uint256) {
        require(bytes(name).length > 0, "Empty name");
        require(endTime > startTime, "Invalid time range");
        require(attendanceCodeHash != bytes32(0), "Empty code hash");

        uint256 id = ++eventCount;
        events[id] = Event({
            name: name,
            startTime: startTime,
            endTime: endTime,
            active: true,
            attendanceCodeHash: attendanceCodeHash
        });

        emit EventCreated(id, name, startTime, endTime);
        return id;
    }

    function setEventActive(uint256 eventId, bool active) external onlyAdmin {
        Event storage e = events[eventId];
        require(bytes(e.name).length != 0, "Event does not exist");
        e.active = active;
        emit EventActiveToggled(eventId, active);
    }

    /**
     * @notice Member checks in to an event by submitting the correct code+salt.
     * @param eventId ID of the event
     * @param code The human-readable code (shown at the event)
     * @param salt A secret salt used when hashing off-chain
     */
    function checkIn(
        uint256 eventId,
        string calldata code,
        bytes32 salt
    ) external onlyMember {
        Event storage e = events[eventId];
        require(bytes(e.name).length != 0, "Event does not exist");
        require(e.active, "Event not active");
        require(
            block.timestamp >= e.startTime && block.timestamp <= e.endTime,
            "Outside event time"
        );
        require(!attended[eventId][msg.sender], "Already checked in");

        bytes32 hash = keccak256(abi.encodePacked(code, salt));
        require(hash == e.attendanceCodeHash, "Invalid code");

        attended[eventId][msg.sender] = true;
        attendanceCount[msg.sender] += 1;
        emit CheckedIn(eventId, msg.sender);

        // If attendance-weighted, you might want to immediately adjust user's voting power.
        if (votingModeInitialized && currentVotingMode == VotingMode.ATTENDANCE_WEIGHTED) {
            _setVotingPowerForMember(msg.sender);
        }
    }

    // ------------------ View helpers ------------------

    function hasUserVoted(uint256 proposalId, address user)
        external
        view
        returns (bool)
    {
        return hasVoted[proposalId][user];
    }

    function hasUserAttended(uint256 eventId, address user)
        external
        view
        returns (bool)
    {
        return attended[eventId][user];
    }
}