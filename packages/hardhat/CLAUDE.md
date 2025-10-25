# CLAUDE.md - Hardhat Package

This file provides guidance when working with the Hardhat package of the Minecraft Onchain Items project.

## Project Overview

This is the smart contract layer of a Scaffold-ETH 2 based project for **Minecraft Onchain Items** - a standard for ERC1155 tokens with special features:

- **Crafting System:** `craft()` method for batch burning & minting (e.g., burn 2 sticks + 3 diamonds → mint diamond pickaxe)
- **Bridge System:** `bridge()` method for onchain burning that emits events to sync with in-game inventory

**Tech Stack:**

- Hardhat 2.22.10
- Solidity 0.8.20
- OpenZeppelin Contracts 5.0.2
- TypeScript 5.8.2
- hardhat-deploy for deployment management
- Ethers v6 for contract interaction

## Directory Structure

```
packages/hardhat/
├── contracts/           # Solidity smart contracts
│   └── YourContract.sol # Main contract (rename for your needs)
├── deploy/              # Deployment scripts (hardhat-deploy)
│   └── 00_deploy_your_contract.ts
├── scripts/             # Helper scripts
│   ├── generateAccount.ts          # Generate new burner wallet
│   ├── importAccount.ts            # Import existing private key
│   ├── listAccount.ts              # View account details
│   ├── revealPK.ts                 # Reveal private key (caution!)
│   ├── runHardhatDeployWithPK.ts   # Deploy with PK management
│   └── generateTsAbis.ts           # Auto-generate TypeScript ABIs
├── test/                # Contract tests (Mocha + Chai)
│   └── YourContract.ts
├── hardhat.config.ts    # Hardhat configuration
├── package.json         # Package dependencies and scripts
├── .env.example         # Environment variables template
└── tsconfig.json        # TypeScript configuration
```

## Available Commands

### Development Workflow

```bash
# Start local Ethereum node
yarn chain
# or
yarn hardhat node --network hardhat --no-deploy

# Deploy contracts to local network
yarn deploy

# Deploy to specific network
yarn deploy --network sepolia

# Deploy specific contract by tag
yarn deploy --tags YourContract
```

### Contract Development

```bash
# Compile contracts
yarn compile

# Clean artifacts and cache
yarn clean

# Flatten contracts (for verification)
yarn flatten

# Run tests with gas reporting
yarn test

# Check TypeScript types
yarn check-types

# Format code (Solidity + TypeScript)
yarn format

# Lint code
yarn lint
```

### Account Management

```bash
# Generate new burner wallet
yarn generate
# or
yarn account:generate

# Import existing private key
yarn account:import

# View account details (address, balance, QR code)
yarn account

# Reveal private key (use cautiously!)
yarn account:reveal-pk
```

### Contract Verification

```bash
# Verify on Etherscan
yarn verify --network <network-name>

# Manual Hardhat verification
yarn hardhat-verify --network <network-name> <contract-address> <constructor-args>
```

### Advanced

```bash
# Fork mainnet locally
yarn fork
# Sets MAINNET_FORKING_ENABLED=true

# Run custom Hardhat tasks
npx hardhat <task-name> --network <network>
```

## Key Configuration Files

### hardhat.config.ts

**Solidity Compiler:**

- Version: 0.8.20
- Optimizer enabled: 200 runs

**Default Network:** localhost

**Named Accounts:**

- `deployer`: First Hardhat account (default: 0)

**Environment Variables:**

- `ALCHEMY_API_KEY`: RPC provider API key (fallback provided)
- `__RUNTIME_DEPLOYER_PRIVATE_KEY`: Deployer private key (defaults to Hardhat account 0)
- `ETHERSCAN_V2_API_KEY`: For contract verification (fallback provided)
- `MAINNET_FORKING_ENABLED`: Set to "true" to fork mainnet

**Configured Networks:**

- Local: hardhat, localhost
- Ethereum: mainnet, sepolia
- Arbitrum: arbitrum, arbitrumSepolia
- Optimism: optimism, optimismSepolia
- Polygon: polygon, polygonAmoy, polygonZkEvm, polygonZkEvmCardona
- Base: base, baseSepolia
- Scroll: scroll, scrollSepolia
- Celo: celo, celoSepolia
- Gnosis: gnosis, chiado

**Custom Deploy Task Hook:**
After deployment, automatically runs `generateTsAbis()` to create TypeScript ABIs for frontend consumption (hardhat.config.ts:145-150).

### package.json Scripts

| Script                   | Description                                 |
| ------------------------ | ------------------------------------------- |
| `yarn chain`             | Start local Hardhat node without deployment |
| `yarn deploy`            | Run deployment scripts with PK management   |
| `yarn compile`           | Compile Solidity contracts                  |
| `yarn test`              | Run tests with gas reporting                |
| `yarn clean`             | Clean Hardhat artifacts                     |
| `yarn fork`              | Fork mainnet locally                        |
| `yarn generate`          | Generate new burner wallet                  |
| `yarn account`           | View account details                        |
| `yarn account:import`    | Import private key                          |
| `yarn account:reveal-pk` | Reveal stored private key                   |
| `yarn verify`            | Verify contracts on Etherscan               |
| `yarn format`            | Format all TypeScript and Solidity files    |
| `yarn lint`              | Run ESLint                                  |
| `yarn check-types`       | Type-check without building                 |

## Development Workflow

### 1. Initial Setup

```bash
# Install dependencies (from project root)
yarn install

# Copy environment variables template
cp .env.example .env

# Edit .env with your API keys (optional for local development)
```

### 2. Local Development

**Terminal 1 - Start local blockchain:**

```bash
yarn chain
```

**Terminal 2 - Deploy contracts:**

```bash
yarn deploy
```

**Terminal 3 - Start frontend (from project root):**

```bash
yarn start
```

### 3. Contract Development Cycle

1. Edit contracts in `contracts/`
2. Update deployment scripts in `deploy/` if needed
3. Compile: `yarn compile`
4. Write/update tests in `test/`
5. Run tests: `yarn test`
6. Deploy: `yarn deploy`
7. Frontend automatically picks up new ABIs (see Hot Reload below)

### 4. Live Network Deployment

```bash
# Set up your deployer account
yarn account:import
# Or generate new one
yarn generate

# Ensure .env has proper API keys
# ALCHEMY_API_KEY=your_alchemy_key
# ETHERSCAN_V2_API_KEY=your_etherscan_key

# Deploy to testnet
yarn deploy --network sepolia

# Verify contracts
yarn verify --network sepolia
```

## Contract Hot Reload System

The package implements automatic ABI generation for frontend consumption:

1. When you run `yarn deploy`, deployment scripts in `deploy/` execute
2. After deployment completes, the custom deploy task hook (hardhat.config.ts:145-150) automatically runs
3. `generateTsAbis()` script (scripts/generateTsAbis.ts) reads deployed contracts
4. TypeScript ABIs are generated and written to `../nextjs/contracts/deployedContracts.ts`
5. Frontend hooks automatically consume the updated ABIs
6. No manual ABI copying needed!

**Flow:**

```
Deploy Contracts → Custom Task Hook → generateTsAbis() → Write to nextjs/contracts/ → Frontend Auto-Updates
```

## Deployment Scripts

### How hardhat-deploy Works

- Scripts in `deploy/` run sequentially (sorted by filename)
- Use numeric prefixes for ordering (e.g., `00_`, `01_`, `02_`)
- Each script exports a default function and tags

**Example deployment script structure:**

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("YourContract", {
    from: deployer,
    args: [constructorArg1, constructorArg2],
    log: true,
    autoMine: true,
  });
};

export default deployYourContract;
deployYourContract.tags = ["YourContract"];
```

**Deployment to specific tags:**

```bash
yarn deploy --tags YourContract
```

### Named Accounts

Defined in `hardhat.config.ts` under `namedAccounts`:

- **deployer**: Default account index 0 (or from `__RUNTIME_DEPLOYER_PRIVATE_KEY`)

## Testing

### Test Structure

Tests use:

- Mocha test framework
- Chai matchers (with hardhat-chai-matchers)
- hardhat-network-helpers for time manipulation

**Example test pattern:**

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { YourContract } from "../typechain-types";

describe("YourContract", function () {
  let yourContract: YourContract;

  beforeEach(async () => {
    const YourContractFactory = await ethers.getContractFactory("YourContract");
    yourContract = await YourContractFactory.deploy();
  });

  it("Should do something", async function () {
    expect(await yourContract.someFunction()).to.equal(expectedValue);
  });
});
```

### Running Tests

```bash
# Run all tests with gas reporting
yarn test

# Run specific test file
npx hardhat test test/YourContract.ts

# Run tests on specific network
yarn test --network hardhat
```

## Account Management

### Account Storage

Private keys are stored in:

- `.env` file as `__RUNTIME_DEPLOYER_PRIVATE_KEY`
- DO NOT commit `.env` to version control!

### Commands

**Generate New Account:**

```bash
yarn generate
# Creates new random wallet
# Shows address, private key, QR code
# Saves to .env
```

**Import Existing Account:**

```bash
yarn account:import
# Prompts for private key (hidden input)
# Validates and saves to .env
```

**View Account:**

```bash
yarn account
# Shows: address, balance, QR code
# Safe - doesn't reveal private key
```

**Reveal Private Key:**

```bash
yarn account:reveal-pk
# USE WITH CAUTION!
# Displays private key in terminal
```

## Network Configuration

### Adding New Networks

Edit `hardhat.config.ts`:

```typescript
networks: {
  yourNetwork: {
    url: `https://rpc.yournetwork.com`,
    accounts: [deployerPrivateKey],
    chainId: 12345, // optional
  },
}
```

### Forking Mainnet

```bash
# Start forked node
yarn fork

# Or manually
MAINNET_FORKING_ENABLED=true yarn chain
```

Uses Alchemy mainnet RPC with your `ALCHEMY_API_KEY`.

## Environment Variables

Create `.env` file (see `.env.example`):

```bash
# Alchemy API Key (for RPC and forking)
ALCHEMY_API_KEY=your_alchemy_api_key

# Deployer private key (auto-managed by account scripts)
__RUNTIME_DEPLOYER_PRIVATE_KEY=0x...

# Etherscan API Key (for verification)
ETHERSCAN_V2_API_KEY=your_etherscan_api_key

# Mainnet forking (optional)
MAINNET_FORKING_ENABLED=false
```

## Best Practices

### Security

- Never commit private keys or `.env` files
- Use burner wallets for development
- Import production keys only when deploying
- Use `yarn account:reveal-pk` sparingly

### Development

- Write tests before deploying to live networks
- Use named accounts for better code readability
- Tag deployment scripts for selective deployment
- Run `yarn clean` if facing compilation issues
- Keep optimizer runs at 200 for balanced gas/size

### Deployment

- Test on testnets before mainnet
- Verify contracts on Etherscan after deployment
- Document constructor arguments for verification
- Use deployment tags for complex multi-contract projects

### Gas Optimization

- Enable gas reporter in tests: `REPORT_GAS=true yarn test`
- Review gas reports before mainnet deployment
- Consider optimizer runs (currently 200)

## Minecraft Onchain Items Implementation

When implementing the Minecraft items standard:

1. **Use ERC1155** from OpenZeppelin contracts
2. **Implement crafting:**
   - `craft(uint256[] memory burnTokenIds, uint256[] memory burnAmounts, uint256 mintTokenId, uint256 mintAmount)`
   - Batch burn inputs, mint output
   - Validate crafting recipes
3. **Implement bridging:**
   - `bridge(uint256[] memory tokenIds, uint256[] memory amounts)`
   - Burn tokens onchain
   - Emit `Burn` event for game backend to listen
4. **Consider adding:**
   - Crafting recipe registry
   - Item metadata (IPFS/onchain)
   - Access control for minting
   - Pausability for emergencies

## Troubleshooting

### Common Issues

**"Error: Cannot find module..."**

```bash
yarn install
```

**"Error: Invalid nonce"**

```bash
yarn clean
# Restart local node
```

**"Error: VM Exception"**

- Check contract logic in tests
- Review gas limits
- Check account balances

**Deployment not updating frontend:**

- Ensure deployment completed successfully
- Check that `generateTsAbis` ran (should see in logs)
- Verify `../nextjs/contracts/deployedContracts.ts` updated
- Restart frontend dev server

**TypeScript errors after contract changes:**

```bash
yarn clean
yarn compile
yarn check-types
```

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [hardhat-deploy Plugin](https://github.com/wighawag/hardhat-deploy)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Scaffold-ETH 2 Docs](https://docs.scaffoldeth.io/)
- [ERC1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [Solidity Documentation](https://docs.soliditylang.org/)

## Quick Reference

### File Locations

- Contracts: `contracts/*.sol`
- Deployment: `deploy/*.ts`
- Tests: `test/*.ts`
- Config: `hardhat.config.ts`
- Generated types: `typechain-types/`
- ABIs output: `../nextjs/contracts/deployedContracts.ts`

### Most Used Commands

```bash
yarn chain          # Start local node
yarn deploy         # Deploy contracts
yarn test           # Run tests
yarn generate       # New wallet
yarn account        # View account
```
