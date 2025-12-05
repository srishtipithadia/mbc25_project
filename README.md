# MBC25 Project

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