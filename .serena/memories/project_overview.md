# Project Overview

## Purpose
This is a **Scaffold-ETH 2** project - a full-stack Ethereum dApp development toolkit designed to make it easier for developers to create and deploy smart contracts and build user interfaces that interact with those contracts.

## Key Features
- **Contract Hot Reload**: Frontend auto-adapts to smart contract changes
- **Custom Hooks**: React hooks wrapping wagmi for simplified smart contract interactions with TypeScript autocompletion
- **Web3 Components**: Collection of common web3 components for quick frontend development
- **Burner Wallet & Local Faucet**: Quick testing with burner wallet and local faucet
- **Wallet Provider Integration**: Connect to different wallet providers and interact with the Ethereum network
- **Built-in Debug UI**: Navigate to `/debug` to interact with deployed contracts
- **Block Explorer**: Navigate to `/blockexplorer` to view local blockchain transactions

## Tech Stack

### Frontend
- **Next.js**: 15.2 (App Router)
- **React**: 19
- **Tailwind CSS**: 4
- **daisyUI**: 5
- **TypeScript**: Strict mode enabled

### Smart Contracts
- **Hardhat**: Development environment
- **Solidity**: 0.8.20
- **OpenZeppelin**: Battle-tested contract implementations

### Web3 Integration
- **Wagmi**: 2.16 - React hooks for Ethereum
- **Viem**: 2.34 - TypeScript Ethereum library
- **RainbowKit**: 2.2 - Wallet connection UI

### Additional
- **State Management**: Zustand
- **Package Manager**: Yarn 3.2.3
- **Node Version**: >= 20.18.3
- **Redis**: 5.9.0

## Monorepo Structure
This project uses Yarn workspaces with two main packages:
- `@se-2/hardhat` - Smart contracts and blockchain interaction
- `@se-2/nextjs` - Frontend web application