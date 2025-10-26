# ⛏️ Minecraft Crafting on Blockchain

A Minecraft-themed on-chain crafting game built with Scaffold-ETH 2. Craft items, manage resources, and experience familiar Minecraft mechanics powered by Ethereum smart contracts.

## 🎮 Features

- **On-Chain Crafting System**: Craft items using recipes stored and executed on the blockchain
- **ERC-1155 Items**: All game items (logs, planks, sticks, tools) are represented as NFTs
- **Minecraft-Style UI**: Familiar crafting interface with Minecraft textures
- **Recipe Management**: Add, remove, and execute crafting recipes via smart contracts
- **Batch Crafting**: Support for crafting multiple items in a single transaction
- **Item Bridging**: Transfer items between different game states

## 📦 Available Items

- Oak Logs & Planks
- Sticks
- Wooden Pickaxe
- Diamonds
- Diamond Pickaxe
- Diamond Sword

## 🛠 Tech Stack

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, Viem, and TypeScript.

- **Frontend**: Next.js 15.2, React 19, Tailwind CSS 4, daisyUI 5
- **Smart Contracts**: Hardhat, Solidity 0.8.20, OpenZeppelin (ERC-1155)
- **Web3**: Wagmi 2.16, Viem 2.34, RainbowKit 2.2
- **State Management**: Zustand

### Scaffold-ETH 2 Features

- ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it
- 🪝 **Custom hooks**: React hooks wrapper around [wagmi](https://wagmi.sh/) for simplified contract interactions
- 🧱 **Web3 Components**: Ready-to-use components for addresses, balances, inputs, and more
- 🔥 **Burner Wallet & Local Faucet**: Quick testing with pre-funded local wallets
- 🔐 **Wallet Provider Integration**: Connect with MetaMask, WalletConnect, and more

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## 🚀 Quick Start

### Installation

1. **Clone the repository and install dependencies:**

```bash
git clone <repository-url>
cd bishkek-hack
yarn install
```

### Running the Application

You'll need **three terminal windows** to run the full application:

#### Terminal 1: Start Local Blockchain

```bash
yarn chain
```

This starts a local Hardhat network. The network runs on `localhost:8545` and provides 10 pre-funded test accounts.

#### Terminal 2: Deploy Smart Contracts

```bash
yarn deploy
```

This deploys the `MinecraftItems` contract to your local network. The contract ABI is automatically generated and synced to the frontend.

#### Terminal 3: Start Frontend

```bash
yarn start
```

The application will be available at **http://localhost:3000**

### 🎯 Using the Application

1. **Connect Wallet**: Click "Connect Wallet" and select a wallet (burner wallet is auto-created for local testing)
2. **Mint Initial Items**: Use the interface to mint starting items (logs, diamonds)
3. **Craft Items**: Follow Minecraft recipes to craft tools and items
4. **View Inventory**: See your item balances in real-time

## 🧪 Development Commands

### Smart Contract Development

```bash
# Compile contracts
yarn compile

# Run contract tests
yarn test
yarn hardhat:test

# Clean artifacts
yarn hardhat:clean

# Deploy to specific network
yarn deploy --network <network-name>
```

### Frontend Development

```bash
# Start dev server
yarn start

# Build for production
yarn next:build

# Type checking
yarn next:check-types

# Lint code
yarn next:lint

# Format code
yarn next:format
```

### Debugging

- **Debug Contracts**: Navigate to http://localhost:3000/debug to interact directly with contract functions
- **Block Explorer**: Navigate to http://localhost:3000/blockexplorer to view transactions and blocks

## 📁 Project Structure

```
bishkek-hack/
├── packages/
│   ├── hardhat/              # Smart contracts
│   │   ├── contracts/
│   │   │   └── MinecraftItems.sol    # Main ERC-1155 crafting contract
│   │   ├── deploy/           # Deployment scripts
│   │   └── test/             # Contract tests
│   │
│   └── nextjs/               # Frontend application
│       ├── app/              # Next.js pages
│       │   └── page.tsx      # Main crafting interface
│       ├── components/       # React components
│       │   └── crafting/     # Crafting UI components
│       ├── hooks/            # Custom React hooks
│       ├── services/web3/    # Web3 utilities
│       │   └── itemConfig.ts # Item to token ID mappings
│       └── scaffold.config.ts # Scaffold-ETH configuration
```


## 📚 Smart Contract Overview

### MinecraftItems.sol

The main contract implementing the crafting system:

- **Standard**: ERC-1155 multi-token standard
- **Key Functions**:
  - `craft(uint256 recipeId)`: Craft items using a recipe
  - `aggrCraft(uint256 recipeId, uint256 times)`: Batch craft multiple items
  - `addRecipe()`: Add new crafting recipes (owner only)
  - `bridge()`: Transfer items between states
  - `mintInitial()` / `mintInitialBatch()`: Mint starting items

### Crafting Recipes

Recipes are stored on-chain with:
- Input token IDs and amounts
- Output token ID and amount
- Automatic validation and execution

## 🔗 Resources

- **Scaffold-ETH 2 Docs**: [docs.scaffoldeth.io](https://docs.scaffoldeth.io)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Hardhat Documentation**: [hardhat.org/docs](https://hardhat.org/docs)
- **Wagmi Documentation**: [wagmi.sh](https://wagmi.sh)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs or issues
- Suggest new features or items
- Submit pull requests
- Improve documentation

## 📝 License

This project is built on Scaffold-ETH 2 and inherits its open-source license.