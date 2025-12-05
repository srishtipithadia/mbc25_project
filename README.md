# MBC25 Project

## Table of Contents

- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Install Dependencies (Root)](#step-2-install-dependencies-root)
  - [Step 3: Configure Environment Variables (Root)](#step-3-configure-environment-variables-root)
  - [Step 4: Compile Contracts (Optional)](#step-4-compile-contracts-optional)
  - [Step 5: Deploy Contracts (Optional)](#step-5-deploy-contracts-optional)
  - [Step 6: Install Frontend Dependencies](#step-6-install-frontend-dependencies)
  - [Step 7: Configure Frontend Environment Variables](#step-7-configure-frontend-environment-variables)
  - [Step 8: Run Development Server](#step-8-run-development-server)
- [Quick Start Summary](#quick-start-summary)

## Repository Structure

```
mbc25_project/
├── contracts/              # Smart contracts
│   └── ClubTreasuryUSDC.sol    # Main treasury contract
├── scripts/                # Deployment scripts
│   └── deploy.js               # Contract deployment script
├── artifacts/              # Compiled contract artifacts (generated)
│   └── contracts/
│       └── ClubTreasuryUSDC.sol/
├── cache/                 # Hardhat cache (generated)
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── abi/              # Contract ABIs
│   │   │   └── ClubTreasuryUSDC.ts
│   │   ├── assets/            # Images and static assets
│   │   │   ├── poolparty-logo-only.png
│   │   │   └── poolparty-logo-name.png
│   │   ├── App.tsx             # Main application component
│   │   ├── main.tsx             # Application entry point
│   │   └── index.css            # Global styles
│   ├── public/                 # Public assets
│   ├── index.html              # HTML template
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.ts          # Vite configuration
│   └── tsconfig.json            # TypeScript configuration
├── hardhat.config.js       # Hardhat configuration
├── package.json            # Root dependencies
└── README.md               # This file
```

## Prerequisites

- Node.js (≥ 20.19, < 25) - We used Node 22
- npm

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd mbc25_project
```

### Step 2: Install Dependencies (Root)

```bash
npm install
```

### Step 3: Configure Environment Variables (Root)

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following environment variables to `.env`:

```
BASE_SEPOLIA_RPC_URL=your_rpc_url_here
PRIVATE_KEY=your_private_key_here
USDC_ADDRESS=your_usdc_address_here
```

### Step 4: Compile Contracts (Optional)

```bash
npx hardhat compile
```

### Step 5: Deploy Contracts (Optional)

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

After deployment, copy the contract address for use in the frontend `.env` file.

### Step 6: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 7: Configure Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
touch .env
```

Add the following environment variables to `frontend/.env`:

```
VITE_BASE_SEPOLIA_RPC_URL=your_rpc_url_here
VITE_CLUB_TREASURY_ADDRESS=your_contract_address_here
VITE_USDC_ADDRESS=your_usdc_address_here
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

### Step 8: Run Development Server

```bash
npm run dev
```

## Quick Start Summary

1. Install Node (≥ 20.19, < 25) and npm
2. `git clone` the repo
3. In root: `npm install` and create `.env`
4. (Optional) `npx hardhat compile` + deploy, and copy contract address
5. In `frontend/`: `npm install` and create `.env`
6. `npm run dev` inside `frontend/`
