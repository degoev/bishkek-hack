# Repository Structure

## Top-Level Directories

```
/
├── .husky/              # Git hooks configuration
├── .github/             # GitHub workflows and configurations
├── .yarn/               # Yarn 3 installation files
├── packages/            # Monorepo packages
│   ├── hardhat/         # Smart contracts package
│   └── nextjs/          # Frontend application package
├── package.json         # Root package.json with workspace scripts
├── .lintstagedrc.js     # Lint-staged configuration
├── CLAUDE.md            # Claude Code project instructions
└── README.md            # Project documentation
```

## Hardhat Package (`packages/hardhat/`)

```
hardhat/
├── contracts/           # Solidity smart contracts
│   ├── YourContract.sol
│   └── MinecraftItems.sol
├── deploy/              # Deployment scripts (using hardhat-deploy)
├── test/                # Contract tests
├── scripts/             # Helper scripts (account management, etc.)
├── deployments/         # Deployment artifacts by network
├── hardhat.config.ts    # Hardhat configuration
├── tsconfig.json        # TypeScript config
├── .prettierrc.json     # Prettier config (Solidity-specific)
└── eslint.config.mjs    # ESLint configuration
```

### Key Hardhat Files
- `hardhat.config.ts` - Network configuration, named accounts, compiler settings
- `deploy/00_deploy_your_contract.ts` - Deployment scripts run sequentially
- `contracts/` - All Solidity smart contracts
- `test/` - Contract tests using Hardhat/Chai

## Next.js Package (`packages/nextjs/`)

```
nextjs/
├── app/                 # Next.js App Router pages
│   ├── page.tsx         # Homepage
│   ├── layout.tsx       # Root layout
│   ├── (scaffold)/      # Scaffold-ETH UI pages
│   │   ├── debug/       # Debug Contracts page
│   │   └── blockexplorer/ # Block explorer page
│   ├── clicker/         # Custom app pages
│   └── api/             # API routes (SSE, etc.)
├── components/          # React components
│   ├── scaffold-eth/    # Reusable web3 components
│   │   ├── Address.tsx
│   │   ├── Balance.tsx
│   │   ├── Input/       # Web3-specific inputs
│   │   └── Contract/    # Contract interaction components
│   └── crafting/        # Custom app components
├── hooks/               # Custom React hooks
│   └── scaffold-eth/    # Web3 hooks wrapping Wagmi
│       ├── useScaffoldReadContract.ts
│       ├── useScaffoldWriteContract.ts
│       ├── useScaffoldWatchContractEvent.ts
│       └── useDeployedContractInfo.ts
├── contracts/           # Auto-generated contract ABIs
│   └── deployedContracts.ts  # Generated from hardhat deploy
├── utils/               # Utility functions
│   └── scaffold-eth/    # Web3 utility functions
├── services/            # Services (e.g., web3 providers, stores)
├── styles/              # Global styles
├── public/              # Static assets
│   └── textures/        # Image assets
├── scaffold.config.ts   # Scaffold-ETH configuration
├── next.config.ts       # Next.js configuration
├── tsconfig.json        # TypeScript config
├── .prettierrc.js       # Prettier config (with Tailwind plugin)
└── eslint.config.mjs    # ESLint configuration
```

### Key Next.js Files
- `scaffold.config.ts` - Network targets, RPC endpoints, wallet settings
- `contracts/deployedContracts.ts` - Auto-generated from contract deployments
- `app/page.tsx` - Main homepage
- `hooks/scaffold-eth/` - Typed wrappers around Wagmi hooks
- `components/scaffold-eth/` - Ready-to-use web3 UI components

## Important Configuration Files

### Network Configuration
- `packages/nextjs/scaffold.config.ts` - Frontend network config (targetNetworks, RPC, etc.)
- `packages/hardhat/hardhat.config.ts` - Hardhat network config, compiler settings

### Path Aliases
- Next.js uses `~~/` as an alias for the package root (defined in tsconfig.json)
- Example: `import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";`

## Auto-Generated Files
- `packages/nextjs/contracts/deployedContracts.ts` - Generated after running `yarn deploy`
- Contains ABIs and addresses of deployed contracts
- Used by Scaffold-ETH hooks for type-safe contract interactions