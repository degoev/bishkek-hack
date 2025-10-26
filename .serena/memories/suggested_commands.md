# Suggested Commands

This file contains the most important commands for developing in this Scaffold-ETH 2 project.

## Development Workflow

### Initial Setup
```bash
# Install dependencies (run once after cloning)
yarn install
```

### Standard Development Flow
Open 3 terminals and run these commands in order:

```bash
# Terminal 1: Start local Ethereum network
yarn chain

# Terminal 2: Deploy contracts to local network
yarn deploy

# Terminal 3: Start Next.js frontend
yarn start
```

The frontend will be available at `http://localhost:3000`

## Smart Contract Development

### Compilation & Deployment
```bash
# Compile contracts
yarn compile
# or
yarn hardhat:compile

# Deploy to local network (make sure yarn chain is running)
yarn deploy

# Deploy to specific network
yarn deploy --network <network-name>

# Deploy specific contract by tag
yarn deploy --tags YourContract

# Clean Hardhat artifacts and cache
yarn hardhat:clean
```

### Testing
```bash
# Run all contract tests
yarn test
# or
yarn hardhat:test

# Run specific test file
yarn hardhat:test test/YourContract.ts
```

### Contract Verification
```bash
# Verify contract on Etherscan
yarn verify --network <network-name>

# Alternative verification command
yarn hardhat:hardhat-verify --network <network-name>
```

### Other Hardhat Commands
```bash
# Flatten contracts (for verification)
yarn hardhat:flatten

# Fork mainnet for testing
yarn fork
# or
yarn hardhat:fork
```

## Frontend Development

### Running the App
```bash
# Start development server (default port 3000)
yarn start
# or
yarn next:dev

# Build for production
yarn next:build

# Serve production build
yarn next:serve
```

### Code Quality
```bash
# Check TypeScript types
yarn next:check-types

# Lint code
yarn next:lint

# Format code with Prettier
yarn next:format
```

### Deployment
```bash
# Deploy to Vercel
yarn vercel

# Login to Vercel
yarn vercel:login

# Quick deploy (skip prompts)
yarn vercel:yolo

# Deploy to IPFS
yarn ipfs
```

## Account Management

```bash
# Generate new burner wallet
yarn generate
# or
yarn account:generate

# View account details
yarn account

# Import existing private key (interactive)
yarn account:import

# Reveal private key (use cautiously!)
yarn account:reveal-pk
```

## Code Quality & Linting

### Root-Level Commands (affect both packages)
```bash
# Lint all packages (Next.js + Hardhat)
yarn lint

# Format all code (Next.js + Hardhat)
yarn format

# Run all tests
yarn test
```

### Package-Specific Commands
```bash
# Hardhat linting and formatting
yarn hardhat:lint
yarn hardhat:format
yarn hardhat:check-types

# Next.js linting and formatting
yarn next:lint
yarn next:format
yarn next:check-types
```

## Useful System Commands (macOS/Darwin)

These standard Unix commands work on macOS:

```bash
# Navigation
cd <directory>        # Change directory
pwd                   # Print working directory
ls -la                # List files with details

# File operations
cat <file>            # View file contents
less <file>           # View file with pagination
grep "pattern" <file> # Search in files
find . -name "*.sol"  # Find files by name

# Git operations
git status            # Check repository status
git log --oneline     # View commit history
git diff              # View changes
git add .             # Stage all changes
git commit -m "msg"   # Commit changes
git push              # Push to remote
git pull              # Pull from remote

# Process management
ps aux | grep node    # Find running Node processes
kill <pid>            # Kill process by ID
```

## Common Development Tasks

### After modifying smart contracts:
```bash
yarn deploy           # Redeploy contracts
# Frontend auto-reloads with new ABIs
```

### After modifying frontend:
```bash
# Next.js hot-reloads automatically
# If needed, restart with: yarn start
```

### Before committing code:
```bash
yarn lint             # Check linting (auto-runs on commit via husky)
yarn format           # Format code
yarn test             # Run tests
```

### Troubleshooting:
```bash
yarn hardhat:clean    # Clean Hardhat artifacts
rm -rf node_modules   # Remove dependencies
yarn install          # Reinstall dependencies
```

## Network-Specific Notes

### Local Development (default)
- Network: Hardhat local node
- RPC: http://127.0.0.1:8545
- Chain ID: 31337
- Pre-funded accounts available
- Configuration: `packages/nextjs/scaffold.config.ts` (targetNetworks: [chains.hardhat])

### Deploying to Live Networks
1. Configure network in `packages/hardhat/hardhat.config.ts`
2. Set environment variables:
   - `ALCHEMY_API_KEY` - For RPC provider
   - `ETHERSCAN_V2_API_KEY` - For contract verification
   - Private key via account import (never commit it!)
3. Update `targetNetworks` in `packages/nextjs/scaffold.config.ts`
4. Deploy: `yarn deploy --network <network-name>`
5. Verify: `yarn verify --network <network-name>`