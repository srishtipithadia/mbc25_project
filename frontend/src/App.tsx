// src/App.tsx
import { useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { formatUnits, parseUnits } from "viem";

import poolpartyLogo from "./assets/poolparty-logo-only.png";
import {
  CLUB_TREASURY_ABI,
  CLUB_TREASURY_ADDRESS,
  USDC_ADDRESS,
} from "./abi/ClubTreasuryUSDC";
import { wagmiConfig } from "./wagmiConfig";

// ---- Types ----
type Proposal = {
  id: number;
  title: string;
  description: string;
  amountUSDC: number;
  yes: number;
  no: number;
  deadline: string;
  executed: boolean;
};

type AttendanceSession = {
  id: number;
  label: string;
};

// ---- Theme colors ----
const COLORS = {
  background: "#FCF8F4",
  navy: "#00234A",
  mutedNavy: "#0D5BAD",
  lightBlue: "#E0F2FE",
  brightBlue: "#3B92D3",
  yellow: "#FBC23D",
  yellowDeep: "#C76C05",
};

// Mock initial data for proposals / attendance list
const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: 1,
    title: "T-shirts for new members",
    description: "Buy club t-shirts for active members this semester.",
    amountUSDC: 600,
    yes: 8,
    no: 2,
    deadline: "2025-12-10 23:59",
    executed: false,
  },
  {
    id: 2,
    title: "Conference Travel Subsidy",
    description: "Subsidize travel for 3 members to attend ETHGlobal NYC.",
    amountUSDC: 900,
    yes: 12,
    no: 1,
    deadline: "2025-12-15 23:59",
    executed: true,
  },
];

const INITIAL_ATTENDANCE_SESSIONS: AttendanceSession[] = [
  { id: 1, label: "Event #1 (on-chain check-in)" },
];

// Minimal ERC20 ABI for approve()
const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// Helpers
function formatUSDC(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function App() {
  const { address, isConnected } = useAccount();
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [attendanceSessions] =
    useState<AttendanceSession[]>(INITIAL_ATTENDANCE_SESSIONS);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        padding: "1.5rem 1.5rem 3rem",
        background: COLORS.background,
        color: COLORS.navy,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1.5rem",
          marginBottom: "1.75rem",
          flexWrap: "wrap",
          width: "92vw",
        }}
      >
        {/* Left: logo + title + nav */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <img
            src={poolpartyLogo}
            alt="PoolParty Logo"
            style={{ width: 96, height: 96 }}
          />

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "2.4rem",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: COLORS.navy,
              }}
            >
              PoolParty
            </h1>
            <p
              style={{
                margin: 0,
                marginTop: "0.2rem",
                fontSize: "0.95rem",
                color: COLORS.mutedNavy,
              }}
            >
              Club funding, voting, and attendance — powered by USDC on Base
            </p>

            {/* Nav under the title */}
            <nav
              style={{
                display: "flex",
                gap: "0.6rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                marginTop: "0.8rem",
                flexWrap: "wrap",
              }}
            >
              <a href="#about" style={navLinkStyle}>
                About us
              </a>
              <a href="#current-proposals" style={navLinkStyle}>
                Current proposals
              </a>
              <a href="#create-proposal" style={navLinkStyle}>
                Create proposal
              </a>
              <a href="#vote" style={navLinkStyle}>
                Vote
              </a>
              <a href="#attendance" style={navLinkStyle}>
                Attendance
              </a>
            </nav>
          </div>
        </div>

        {/* Right: connect button */}
        <div style={{ minWidth: "fit-content" }}>
          <ConnectButton />
        </div>
      </header>

      {!isConnected && (
        <p style={{ color: COLORS.mutedNavy, fontSize: "0.95rem" }}>
          Connect your wallet on <strong>Base Sepolia</strong> to interact with
          the live PoolParty contract. You’ll see deposits and attendance
          check-ins on the block explorer.
        </p>
      )}

      {isConnected && (
        <main
          style={{
            display: "grid",
            gap: "1.5rem",
            maxWidth: 1040,
            marginTop: "1rem",
          }}
        >
          <AboutSection />
          <TreasurySection />
          <ProposalsSection
            proposals={proposals}
            setProposals={setProposals}
          />
          <AttendanceSection
            sessions={attendanceSessions}
            currentAddress={address ?? ""}
          />
        </main>
      )}

      {isConnected && (
        <footer
          style={{
            marginTop: "2.25rem",
            fontSize: "0.8rem",
            color: COLORS.mutedNavy,
          }}
        >
          Connected as{" "}
          <span style={{ fontFamily: "monospace", color: COLORS.navy }}>
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </span>
        </footer>
      )}
    </div>
  );
}

// ---- About ----
function AboutSection() {
  return (
    <section style={cardStyle} id="about">
      <h2 style={cardTitleStyle}>About PoolParty</h2>
      <p style={bodyTextStyle}>
        PoolParty is a treasury app for student clubs and communities. All funds
        sit in a shared USDC pool on Base, and members vote on how those funds
        are allocated. Attendance can be logged on-chain so voting power can
        reflect real participation.
      </p>
    </section>
  );
}

// ---- Treasury (REAL on-chain) ----
function TreasurySection() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Read treasury balance from contract
  const {
    data: onchainBalance,
    isLoading,
    isError,
    refetch,
  } = useReadContract({
    address: CLUB_TREASURY_ADDRESS,
    abi: CLUB_TREASURY_ABI,
    functionName: "treasuryBalanceUSDC",
    query: {
      refetchInterval: 15000, // auto-refresh every 15s
    },
  });

  const [amountInput, setAmountInput] = useState("");
  const [status, setStatus] = useState<
    "idle" | "approving" | "depositing" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);

  const displayBalance = useMemo(() => {
    if (!onchainBalance || typeof onchainBalance !== "bigint") return 0;
    // USDC has 6 decimals
    const formatted = formatUnits(onchainBalance as bigint, 6);
    return Number(formatted);
  }, [onchainBalance]);

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    if (!amountInput || Number(amountInput) <= 0) return;

    setStatus("idle");
    setStatusMessage(null);
    setLastTxHash(null);

    try {
      const amountBig = parseUnits(amountInput, 6); // USDC 6 decimals

      // 1) Approve the treasury contract to spend USDC
      setStatus("approving");
      setStatusMessage("1/2: Approving USDC spend…");
      const approveHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CLUB_TREASURY_ADDRESS, amountBig],
      });

      await waitForTransactionReceipt(wagmiConfig, {
        hash: approveHash,
      });

      // 2) Call depositUSDC on the treasury contract
      setStatus("depositing");
      setStatusMessage("2/2: Depositing into PoolParty treasury…");
      const depositHash = await writeContractAsync({
        address: CLUB_TREASURY_ADDRESS,
        abi: CLUB_TREASURY_ABI,
        functionName: "depositUSDC",
        args: [amountBig],
      });

      await waitForTransactionReceipt(wagmiConfig, {
        hash: depositHash,
      });

      setLastTxHash(depositHash);
      setStatus("success");
      setStatusMessage("Deposit completed! Refreshing balance…");
      setAmountInput("");
      await refetch();
    } catch (err: any) {
      console.error("Deposit error", err);
      setStatus("error");
      setStatusMessage(
        err?.shortMessage ||
          err?.message ||
          "Transaction failed or was rejected."
      );
    }
  }

  return (
    <section style={cardStyle}>
      <h2 style={cardTitleStyle}>Treasury Balance (on-chain)</h2>

      {isLoading && (
        <p style={smallTextStyle}>Loading treasury balance from Base…</p>
      )}

      {!isLoading && !isError && (
        <p
          style={{
            fontSize: "1.7rem",
            fontWeight: 800,
            marginTop: "0.25rem",
          }}
        >
          {formatUSDC(displayBalance)} USDC
        </p>
      )}

      {isError && (
        <p
          style={{
            ...smallTextStyle,
            color: "#B91C1C",
            marginTop: "0.3rem",
          }}
        >
          Error reading on-chain contract balance.
        </p>
      )}

      <p style={smallTextStyle}>
        When you deposit here, you will see a USDC <code>approve</code> and a{" "}
        <code>depositUSDC</code> transaction for{" "}
        <code>{CLUB_TREASURY_ADDRESS}</code> on{" "}
        <strong>Base Sepolia</strong>.
      </p>

      <form
        onSubmit={handleDeposit}
        style={{
          marginTop: "0.75rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount to deposit (USDC)"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          style={inputStyle}
        />
        <button
          type="submit"
          style={primaryButtonStyle}
          disabled={status === "approving" || status === "depositing"}
        >
          {status === "approving"
            ? "Approving…"
            : status === "depositing"
            ? "Depositing…"
            : "Deposit to Treasury"}
        </button>
      </form>

      {status !== "idle" && statusMessage && (
        <p
          style={{
            ...smallTextStyle,
            marginTop: "0.5rem",
            color:
              status === "success"
                ? "#16A34A"
                : status === "error"
                ? "#B91C1C"
                : COLORS.mutedNavy,
          }}
        >
          {statusMessage}
        </p>
      )}

      {lastTxHash && (
        <p style={{ ...smallTextStyle, marginTop: "0.3rem" }}>
          View on BaseScan:{" "}
          <a
            href={`https://sepolia.basescan.org/tx/${lastTxHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {lastTxHash.slice(0, 10)}…{lastTxHash.slice(-6)}
          </a>
        </p>
      )}
    </section>
  );
}

// ---- Proposals (still mock, local state) ----
function ProposalsSection(props: {
  proposals: Proposal[];
  setProposals: (p: Proposal[]) => void;
}) {
  const { proposals, setProposals } = props;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  function handleCreateProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !amount) return;
    const nextId = (proposals[proposals.length - 1]?.id ?? 0) + 1;
    const newProposal: Proposal = {
      id: nextId,
      title,
      description,
      amountUSDC: Number(amount),
      yes: 0,
      no: 0,
      deadline: "TBD (off-chain mock)",
      executed: false,
    };
    setProposals([...proposals, newProposal]);
    setTitle("");
    setDescription("");
    setAmount("");
  }

  function vote(id: number, support: boolean) {
    setProposals(
      proposals.map((p) =>
        p.id === id
          ? {
              ...p,
              yes: support ? p.yes + 1 : p.yes,
              no: !support ? p.no + 1 : p.no,
            }
          : p
      )
    );
  }

  return (
    <section style={cardStyle}>
      {/* Create proposal */}
      <div id="create-proposal">
        <h2 style={cardTitleStyle}>Create Proposal (mock)</h2>

        <form
          onSubmit={handleCreateProposal}
          style={{ display: "grid", gap: "0.75rem", marginBottom: "1.4rem" }}
        >
          <input
            type="text"
            placeholder="Proposal title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
          <textarea
            placeholder="Description / rationale"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount (USDC)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={primaryButtonStyle}>
            Create Proposal (off-chain mock)
          </button>
        </form>
      </div>

      {/* List & vote */}
      <div id="current-proposals">
        <h3
          style={{
            marginTop: 0,
            marginBottom: "0.5rem",
            fontSize: "1rem",
            color: COLORS.navy,
          }}
        >
          Current Proposals
        </h3>
      </div>

      {proposals.length === 0 && (
        <p style={smallTextStyle}>No proposals yet. Create one above.</p>
      )}

      <div id="vote" style={{ display: "grid", gap: "0.8rem" }}>
        {proposals.map((p) => {
          const totalVotes = p.yes + p.no;
          const yesPct =
            totalVotes === 0 ? 0 : Math.round((p.yes * 100) / totalVotes);
          return (
            <div
              key={p.id}
              style={{
                padding: "0.9rem 1rem",
                borderRadius: "0.7rem",
                background: COLORS.lightBlue,
                border: `2px solid ${COLORS.navy}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  alignItems: "baseline",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: COLORS.mutedNavy,
                      marginBottom: "0.25rem",
                    }}
                  >
                    #{p.id} • {p.executed ? "Executed" : "Open"}
                  </div>
                  <h4 style={{ margin: 0, fontSize: "1rem", color: COLORS.navy }}>
                    {p.title}
                  </h4>
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: COLORS.mutedNavy,
                    textAlign: "right",
                  }}
                >
                  {formatUSDC(p.amountUSDC)} USDC
                  <br />
                  <span style={{ fontSize: "0.8rem" }}>
                    Deadline: {p.deadline}
                  </span>
                </div>
              </div>

              {p.description && (
                <p
                  style={{
                    marginTop: "0.45rem",
                    marginBottom: "0.45rem",
                    color: COLORS.mutedNavy,
                    fontSize: "0.9rem",
                  }}
                >
                  {p.description}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  marginTop: "0.4rem",
                }}
              >
                <div style={{ fontSize: "0.85rem", color: COLORS.mutedNavy }}>
                  Yes: {p.yes} • No: {p.no}{" "}
                  {totalVotes > 0 && <span>• {yesPct}% support</span>}
                </div>
                {!p.executed && (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => vote(p.id, true)}
                      style={pillButtonYellow}
                    >
                      Vote Yes (mock)
                    </button>
                    <button
                      type="button"
                      onClick={() => vote(p.id, false)}
                      style={pillButtonBlue}
                    >
                      Vote No (mock)
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---- Attendance (REAL checkIn call) ----
function AttendanceSection(props: {
  sessions: AttendanceSession[];
  currentAddress: string;
}) {
  const { sessions, currentAddress } = props;
  const { writeContractAsync } = useWriteContract();

  const [eventId, setEventId] = useState("1");
  const [code, setCode] = useState("");
  const [salt, setSalt] = useState(
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const activeSession = sessions[sessions.length - 1];

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setMessage(null);
    setTxHash(null);

    try {
      if (!eventId || !code || !salt) {
        setStatus("error");
        setMessage("Please fill in event ID, code, and salt.");
        return;
      }

      setStatus("pending");
      setMessage("Submitting on-chain attendance…");

      const hash = await writeContractAsync({
        address: CLUB_TREASURY_ADDRESS,
        abi: CLUB_TREASURY_ABI,
        functionName: "checkIn",
        args: [BigInt(eventId), code, salt as `0x${string}`],
      });

      await waitForTransactionReceipt(wagmiConfig, { hash });

      setStatus("success");
      setTxHash(hash);
      setMessage("Attendance recorded on-chain!");
      setCode("");
    } catch (err: any) {
      console.error("checkIn error", err);
      setStatus("error");
      setMessage(
        err?.shortMessage ||
          err?.message ||
          "checkIn failed (are you a member, and is the code/salt correct?)."
      );
    }
  }

  return (
    <section style={cardStyle} id="attendance">
      <h2 style={cardTitleStyle}>Attendance (on-chain)</h2>

      <ul
        style={{
          marginTop: "0.4rem",
          marginBottom: "0.8rem",
          paddingLeft: "1.2rem",
          fontSize: "0.9rem",
          color: COLORS.mutedNavy,
        }}
      >
        <li>Your connected address must be a <strong>member</strong>.</li>
        <li>
          The event with that ID must already exist on-chain with a matching
          <code> attendanceCodeHash</code>.
        </li>
      </ul>

      {activeSession && (
        <p style={smallTextStyle}>
          Example label: <strong>{activeSession.label}</strong>
        </p>
      )}

      <form
        onSubmit={handleCheckIn}
        style={{ display: "grid", gap: "0.7rem", marginTop: "0.75rem" }}
      >
        <input
          type="number"
          min="1"
          step="1"
          placeholder="Event ID (e.g. 1)"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Attendance code (human code used when hashing)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Salt used when hashing (bytes32)"
          value={salt}
          onChange={(e) => setSalt(e.target.value)}
          style={inputStyle}
        />
        <button
          type="submit"
          style={primaryButtonStyle}
          disabled={status === "pending"}
        >
          {status === "pending" ? "Submitting…" : "Check In On-Chain"}
        </button>
      </form>

      {status !== "idle" && message && (
        <p
          style={{
            ...smallTextStyle,
            marginTop: "0.5rem",
            color:
              status === "success"
                ? "#16A34A"
                : status === "error"
                ? "#B91C1C"
                : COLORS.mutedNavy,
          }}
        >
          {message}
        </p>
      )}

      {txHash && (
        <p style={{ ...smallTextStyle, marginTop: "0.3rem" }}>
          View check-in tx:{" "}
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {txHash.slice(0, 10)}…{txHash.slice(-6)}
          </a>
        </p>
      )}

      {/* <p style={{ ...smallTextStyle, marginTop: "0.75rem" }}>
        <strong>Dev note:</strong> To create an event with a matching hash,
        compute:
        <code> keccak256(abi.encodePacked(code, salt)) </code> and pass that as{" "}
        <code>attendanceCodeHash</code> when you call <code>createEvent</code>{" "}
        from an admin wallet.
      </p>

      <p style={{ ...smallTextStyle, marginTop: "0.4rem" }}>
        Current address:{" "}
        <span style={{ fontFamily: "monospace" }}>
          {currentAddress
            ? `${currentAddress.slice(0, 6)}…${currentAddress.slice(-4)}`
            : "not connected"}
        </span>
      </p> */}
    </section>
  );
}

// ---- Shared styles ----
const cardStyle: React.CSSProperties = {
  padding: "1.4rem 1.6rem",
  borderRadius: "1rem",
  background: COLORS.lightBlue,
  border: `2px solid ${COLORS.navy}`,
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

const cardTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: "0.75rem",
  fontSize: "1.2rem",
  fontWeight: 700,
  color: COLORS.navy,
};

const bodyTextStyle: React.CSSProperties = {
  margin: 0,
  color: COLORS.mutedNavy,
  fontSize: "0.95rem",
  lineHeight: 1.55,
};

const smallTextStyle: React.CSSProperties = {
  marginTop: "0.45rem",
  color: COLORS.mutedNavy,
  fontSize: "0.85rem",
};

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.7rem",
  borderRadius: "0.7rem",
  border: `2px solid ${COLORS.navy}`,
  background: "#FFFFFF",
  color: COLORS.navy,
  fontSize: "0.9rem",
  flex: 1,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "0.55rem 1.4rem",
  borderRadius: "999px",
  border: `2px solid ${COLORS.brightBlue}`,
  fontWeight: 700,
  background: COLORS.brightBlue,
  color: COLORS.navy,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const pillButtonBlue: React.CSSProperties = {
  padding: "0.3rem 0.9rem",
  borderRadius: "999px",
  border: `2px solid ${COLORS.brightBlue}`,
  background: COLORS.brightBlue,
  color: COLORS.navy,
  fontSize: "0.8rem",
  cursor: "pointer",
};

const pillButtonYellow: React.CSSProperties = {
  padding: "0.3rem 0.9rem",
  borderRadius: "999px",
  border: `2px solid ${COLORS.yellowDeep}`,
  background: COLORS.yellow,
  color: COLORS.navy,
  fontSize: "0.8rem",
  cursor: "pointer",
};

const navLinkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#FFFFFF",
  padding: "0.3rem 0.8rem",
  borderRadius: "999px",
  border: `1px solid ${COLORS.brightBlue}`,
  background: COLORS.brightBlue,
  cursor: "pointer",
  fontSize: "0.85rem",
} as const;