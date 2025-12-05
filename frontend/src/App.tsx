// src/App.tsx
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import poolpartyLogo from "./assets/poolparty-logo-only.png";

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
  code: string;
  attendees: string[];
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

const INITIAL_TREASURY_BALANCE = 2500.5;

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
  {
    id: 1,
    label: "General Meeting 1",
    code: "MBC-1234",
    attendees: [],
  },
];

function formatUSDC(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function App() {
  const { address, isConnected } = useAccount();
  const [treasuryBalance, setTreasuryBalance] = useState(
    INITIAL_TREASURY_BALANCE
  );
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [attendanceSessions, setAttendanceSessions] = useState<
    AttendanceSession[]
  >(INITIAL_ATTENDANCE_SESSIONS);

  return (
    <div
      style={{
        minHeight: "100vh",
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
        }}
      >
        {/* Left: logo + title + nav */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <img
            src={poolpartyLogo}
            alt="PoolParty Logo"
            style={{ width: 80, height: 80 }}
          />

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "2.2rem",
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
              Club funding, voting, and attendance — powered by USDC on Base (mock
              demo)
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
          Connect your wallet to explore the PoolParty prototype. All values are
          mocked for hackathon demo purposes.
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
          <TreasurySection
            treasuryBalance={treasuryBalance}
            setTreasuryBalance={setTreasuryBalance}
          />
          <ProposalsSection
            proposals={proposals}
            setProposals={setProposals}
          />
          <AttendanceSection
            sessions={attendanceSessions}
            setSessions={setAttendanceSessions}
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
          {" • "}
          All data is mock only (no real USDC moved).
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
        PoolParty is a mini treasury app for student clubs and communities. All
        funds sit in a shared USDC pool on Base, and members vote on how those
        funds are allocated. Attendance is tracked with on-chain codes so voting
        power can reflect real participation.{" "}
        <strong>This demo uses mock data only</strong> but mirrors the full
        on-chain flow: deposit → propose → vote → execute.
      </p>
    </section>
  );
}

// ---- Treasury ----
function TreasurySection(props: {
  treasuryBalance: number;
  setTreasuryBalance: (v: number) => void;
}) {
  const { treasuryBalance, setTreasuryBalance } = props;
  const [mockDeposit, setMockDeposit] = useState("");

  function handleMockDeposit(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(mockDeposit);
    if (!val || val <= 0) return;
    setTreasuryBalance(treasuryBalance + val);
    setMockDeposit("");
  }

  return (
    <section style={cardStyle}>
      <h2 style={cardTitleStyle}>Treasury Balance</h2>

      <p style={{ fontSize: "1.7rem", fontWeight: 800, marginTop: "0.25rem" }}>
        {formatUSDC(treasuryBalance)} USDC
      </p>

      <p style={smallTextStyle}>
        In a real deployment, this would read from the on-chain contract on
        Base. For the hackathon demo, we simulate deposits below.
      </p>

      <form
        onSubmit={handleMockDeposit}
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
          placeholder="Fake deposit (USDC)"
          value={mockDeposit}
          onChange={(e) => setMockDeposit(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" style={primaryButtonStyle}>
          Simulate Deposit
        </button>
      </form>
    </section>
  );
}

// ---- Proposals ----
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
      deadline: "TBD (mock)",
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
        <h2 style={cardTitleStyle}>Create Proposal</h2>

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
            Create Proposal (mock)
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
                background: "#FAFBFF",
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

// ---- Attendance ----
function AttendanceSection(props: {
  sessions: AttendanceSession[];
  setSessions: (s: AttendanceSession[]) => void;
  currentAddress: string;
}) {
  const { sessions, setSessions, currentAddress } = props;

  const activeSession = sessions[sessions.length - 1];
  const [inputCode, setInputCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function handleSubmitAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSession) return;
    if (inputCode.trim() !== activeSession.code) {
      setStatus("error");
      setMessage("Invalid code for this session.");
      return;
    }
    if (activeSession.attendees.includes(currentAddress)) {
      setStatus("error");
      setMessage("You already checked in for this session.");
      return;
    }

    const updatedSessions = sessions.map((s) =>
      s.id === activeSession.id
        ? { ...s, attendees: [...s.attendees, currentAddress] }
        : s
    );

    setSessions(updatedSessions);
    setInputCode("");
    setStatus("success");
    setMessage("Attendance recorded (mock).");
  }

  return (
    <section style={cardStyle}>
      <h2 style={cardTitleStyle}>Attendance</h2>

      {!activeSession && (
        <p style={smallTextStyle}>
          No active attendance session. Admins would normally create a new
          session and on-chain code; here we use a mock code.
        </p>
      )}

      {activeSession && (
        <>
          <p style={bodyTextStyle}>
            Current session:{" "}
            <span style={{ fontWeight: 600 }}>{activeSession.label}</span>
          </p>
          <p style={smallTextStyle}>
            Event code (shared by admins):{" "}
            <span
              style={{
                fontFamily: "monospace",
                padding: "0.1rem 0.4rem",
                borderRadius: "0.3rem",
                background: COLORS.lightBlue,
                border: `2px solid ${COLORS.navy}`,
              }}
            >
              {activeSession.code}
            </span>
          </p>

          <form
            onSubmit={handleSubmitAttendance}
            style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}
          >
            <input
              type="text"
              placeholder="Enter attendance code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: 180 }}
            />
            <button type="submit" style={primaryButtonStyle}>
              Submit Attendance (mock)
            </button>
          </form>

          {status !== "idle" && (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.85rem",
                color: status === "success" ? "#16A34A" : "#DC2626",
              }}
            >
              {message}
            </p>
          )}

          <div style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
            <strong>Attendees ({activeSession.attendees.length}):</strong>
            {activeSession.attendees.length === 0 && (
              <span style={{ color: COLORS.mutedNavy }}> none yet</span>
            )}
            {activeSession.attendees.length > 0 && (
              <ul
                style={{
                  marginTop: "0.4rem",
                  paddingLeft: "1.2rem",
                }}
              >
                {activeSession.attendees.map((a) => (
                  <li key={a} style={{ fontFamily: "monospace" }}>
                    {a.slice(0, 6)}…{a.slice(-4)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
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
