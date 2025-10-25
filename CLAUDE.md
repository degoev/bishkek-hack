# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Scaffold-ETH 2 project - a full-stack Ethereum dApp development toolkit built with NextJS, RainbowKit, Hardhat, Wagmi, Viem, and TypeScript. It uses a monorepo structure with Yarn workspaces.

**Tech Stack:**
- **Frontend:** Next.js 15.2, React 19, Tailwind CSS 4, daisyUI 5
- **Smart Contracts:** Hardhat, Solidity 0.8.20, OpenZeppelin contracts
- **Web3:** Wagmi 2.16, Viem 2.34, RainbowKit 2.2
- **State Management:** Zustand
- **Package Manager:** Yarn 3.2.3
- **Node Version:** >= 20.18.3

## Repository Structure

- `packages/hardhat/` - Smart contracts, deployment scripts, and Hardhat configuration
  - `contracts/` - Solidity smart contracts (e.g., `YourContract.sol`)
  - `deploy/` - Deployment scripts using hardhat-deploy
  - `test/` - Contract tests
  - `scripts/` - Account management and helper scripts

- `packages/nextjs/` - Next.js frontend application
  - `app/` - Next.js app directory with pages
  - `components/` - React components
    - `scaffold-eth/` - Reusable web3 components (Address, Balance, Input, etc.)
  - `hooks/scaffold-eth/` - Custom React hooks wrapping Wagmi
  - `contracts/deployedContracts.ts` - Auto-generated contract ABIs and addresses
  - `scaffold.config.ts` - Scaffold-ETH configuration (target networks, RPC endpoints)
  - `utils/scaffold-eth/` - Utility functions for web3 operations

## Common Commands

### Development Workflow

```bash
# Install dependencies
yarn install

# Start local Ethereum node (Terminal 1)
yarn chain

# Deploy contracts to local network (Terminal 2)
yarn deploy

# Start Next.js frontend (Terminal 3)
yarn start
```

### Smart Contract Development

```bash
# Compile contracts
yarn compile
# or
yarn hardhat:compile

# Run contract tests
yarn test
# or
yarn hardhat:test

# Clean Hardhat artifacts
yarn hardhat:clean

# Deploy to specific network
yarn deploy --network <network-name>

# Verify contract on Etherscan
yarn verify --network <network-name>
```

### Frontend Development

```bash
# Start Next.js dev server
yarn start
# or
yarn next:dev

# Build for production
yarn next:build

# Check TypeScript types
yarn next:check-types

# Format code
yarn next:format

# Lint code
yarn next:lint
```

### Account Management

```bash
# Generate new burner wallet
yarn generate

# Import existing private key
yarn account:import

# View account details
yarn account

# Reveal private key (use cautiously)
yarn account:reveal-pk
```

### Testing & Quality

```bash
# Run all tests
yarn test

# Lint all packages
yarn lint

# Format all code
yarn format

# Check types in Hardhat package
yarn hardhat:check-types
```

## Architecture

### Contract Hot Reload System

Scaffold-ETH 2 implements automatic contract hot reload:
1. When contracts are deployed via `yarn deploy`, the deployment script at `packages/hardhat/deploy/` runs
2. After deployment, `generateTsAbis` (hardhat.config.ts:145-150) automatically generates TypeScript ABIs
3. Generated ABIs are written to `packages/nextjs/contracts/deployedContracts.ts`
4. Frontend hooks (in `packages/nextjs/hooks/scaffold-eth/`) consume these auto-generated contract definitions
5. Changes to contracts are immediately reflected in the frontend without manual ABI updates

### Web3 Integration Flow

1. **Configuration:** `packages/nextjs/scaffold.config.ts` defines target networks, RPC endpoints, wallet settings
2. **Providers:** `ScaffoldEthAppWithProviders` component wraps the app with Wagmi and RainbowKit providers
3. **Custom Hooks:** `hooks/scaffold-eth/` provides typed wrappers around Wagmi:
   - `useScaffoldReadContract` - Read contract state
   - `useScaffoldWriteContract` - Write to contracts
   - `useScaffoldWatchContractEvent` - Listen to contract events
   - `useScaffoldContract` - Get contract instance
   - `useDeployedContractInfo` - Get deployed contract info
4. **Components:** `components/scaffold-eth/` provides ready-to-use web3 UI components with proper formatting and validation

### Network Configuration

Default configuration uses local Hardhat network. To target different networks:
1. Edit `packages/nextjs/scaffold.config.ts` - change `targetNetworks` array
2. Ensure corresponding network is configured in `packages/hardhat/hardhat.config.ts`
3. For live networks, set up environment variables:
   - `ALCHEMY_API_KEY` - RPC provider API key
   - `ETHERSCAN_V2_API_KEY` - For contract verification
   - Private keys are managed through account scripts (never commit them)

### Deployment Process

1. Deployment scripts in `packages/hardhat/deploy/` run sequentially (prefixed with numbers)
2. Scripts use `hardhat-deploy` plugin with named accounts (see `namedAccounts` in hardhat.config.ts)
3. On localhost, uses first Hardhat account (pre-funded)
4. On live networks, uses account from `__RUNTIME_DEPLOYER_PRIVATE_KEY` env var
5. After deployment, ABIs are auto-generated for frontend consumption
6. Deploy to specific tags: `yarn deploy --tags YourContract`

## Key Files to Modify

- **Smart Contracts:** `packages/hardhat/contracts/YourContract.sol`
- **Deployment Logic:** `packages/hardhat/deploy/00_deploy_your_contract.ts`
- **Frontend Homepage:** `packages/nextjs/app/page.tsx`
- **Network Config:** `packages/nextjs/scaffold.config.ts`
- **Hardhat Config:** `packages/hardhat/hardhat.config.ts`

## Built-in Features

- **Debug Contracts UI:** Navigate to `/debug` to interact with deployed contracts
- **Block Explorer:** Navigate to `/blockexplorer` to view local blockchain transactions
- **Burner Wallet:** Automatic local wallet for testing (when `onlyLocalBurnerWallet: true`)
- **Local Faucet:** Get test ETH when using local network
- **Contract Hot Reload:** Frontend auto-updates when contracts change
