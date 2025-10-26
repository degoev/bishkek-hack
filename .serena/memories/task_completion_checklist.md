# Task Completion Checklist

This file outlines what should be done when a development task is completed.

## Automatic Pre-Commit Checks

The project uses **Husky** and **lint-staged** to automatically run checks before commits:

### For Next.js TypeScript Files
- ESLint with auto-fix (`--fix`)
- TypeScript type checking
- Import sorting (via Prettier plugin)
- Tailwind class sorting (via Prettier plugin)

### For Hardhat TypeScript Files
- ESLint with auto-fix (`--fix`)
- Prettier formatting

**These run automatically when you commit** - you don't need to run them manually, but you can if you want to check before committing.

## Manual Checks Before Committing

### 1. Code Quality
```bash
# Format all code (both Next.js and Hardhat)
yarn format

# Lint all code (both packages)
yarn lint
```

### 2. Type Checking
```bash
# Check TypeScript types in Next.js
yarn next:check-types

# Check TypeScript types in Hardhat
yarn hardhat:check-types
```

### 3. Testing
```bash
# Run all contract tests
yarn test
# or
yarn hardhat:test
```

## After Smart Contract Changes

### 1. Recompile and Deploy
```bash
# Compile contracts
yarn compile

# Deploy to local network (make sure yarn chain is running)
yarn deploy
```

### 2. Verify Auto-Generated Files
- Check that `packages/nextjs/contracts/deployedContracts.ts` was updated
- This file is auto-generated after deployment
- Frontend hooks use this file for type-safe contract interactions

### 3. Test Contract Interactions
- Use the Debug Contracts UI at `http://localhost:3000/debug`
- Verify all contract functions work as expected
- Check events are emitted correctly

### 4. Update Tests
- Ensure contract tests cover new functionality
- Run `yarn test` to verify all tests pass

## After Frontend Changes

### 1. Verify Build
```bash
# Build for production to catch build-time errors
yarn next:build
```

### 2. Check Types and Linting
```bash
# Type check
yarn next:check-types

# Lint
yarn next:lint
```

### 3. Manual Testing
- Test the UI in the browser
- Check responsive design (mobile, tablet, desktop)
- Verify web3 interactions work correctly
- Test with different wallet states (connected, disconnected)

## Before Deploying to Production

### Smart Contracts
1. **Security Review**
   - Remove debug imports (`hardhat/console.sol`)
   - Review access control modifiers
   - Check for common vulnerabilities (reentrancy, overflow, etc.)
   - Consider external audit for critical contracts

2. **Testing**
   - Ensure 100% test coverage for critical functions
   - Run tests on forked mainnet if applicable
   - Test with realistic gas prices

3. **Verification**
   - Have Etherscan API key ready
   - Plan to verify contracts after deployment
   - Prepare constructor arguments if needed

4. **Configuration**
   - Update network settings in `hardhat.config.ts`
   - Set up environment variables (API keys, private keys)
   - Configure deployment scripts for target network

### Frontend
1. **Environment Variables**
   - Set production API keys (Alchemy, WalletConnect)
   - Configure RPC endpoints for target networks
   - Update `scaffold.config.ts` with production networks

2. **Build and Test**
   ```bash
   yarn next:build
   yarn next:serve  # Test production build locally
   ```

3. **Configuration**
   - Update `targetNetworks` in `scaffold.config.ts`
   - Ensure contract addresses are correct in `deployedContracts.ts`
   - Verify RPC endpoints and API keys

4. **Deployment**
   ```bash
   # For Vercel deployment
   yarn vercel:login
   yarn vercel
   
   # For IPFS deployment
   yarn ipfs
   ```

## Git Workflow Best Practices

### Before Committing
```bash
# 1. Check what's changed
git status
git diff

# 2. Stage files
git add .

# 3. Commit (husky will run pre-commit hooks)
git commit -m "descriptive message"

# If pre-commit hooks fail, fix issues and recommit
```

### Commit Message Guidelines
- Use clear, descriptive messages
- Start with a verb (Add, Update, Fix, Refactor, etc.)
- Reference issue numbers when applicable
- Examples:
  - "Add staking functionality to YourContract"
  - "Fix balance display issue on mobile"
  - "Refactor crafting interface components"
  - "Update deployment script for sepolia network"

### After Committing
```bash
# Push to remote
git push

# Create pull request if working on a feature branch
```

## Post-Deployment Verification

### Smart Contracts
1. Verify contract on block explorer (Etherscan)
2. Test contract functions via block explorer interface
3. Monitor for any unexpected events or errors
4. Check gas usage is within expected range

### Frontend
1. Test all features in production environment
2. Verify wallet connections work
3. Check contract interactions function correctly
4. Monitor for console errors
5. Test on multiple browsers and devices

## Troubleshooting Common Issues

### Build Failures
```bash
# Clean and rebuild
yarn hardhat:clean
yarn compile
```

### Type Errors
```bash
# Check types
yarn next:check-types
yarn hardhat:check-types

# If deployedContracts.ts is outdated, redeploy
yarn deploy
```

### Test Failures
```bash
# Clean and retest
yarn hardhat:clean
yarn compile
yarn test
```

### Lint Failures
```bash
# Auto-fix most issues
yarn format
yarn lint
```

## Summary Checklist

**For every task:**
- [ ] Code formatted (`yarn format`)
- [ ] Code linted (`yarn lint`)
- [ ] Types checked (`yarn next:check-types`, `yarn hardhat:check-types`)
- [ ] Tests pass (`yarn test`)
- [ ] Manual testing completed
- [ ] Git commit with clear message

**For contract changes:**
- [ ] Contracts compiled (`yarn compile`)
- [ ] Contracts deployed (`yarn deploy`)
- [ ] Contract tests updated and passing
- [ ] Debug UI tested

**For frontend changes:**
- [ ] Production build successful (`yarn next:build`)
- [ ] UI tested in browser
- [ ] Web3 interactions verified

**Before production deployment:**
- [ ] Security review completed
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Contracts verified on block explorer
- [ ] Production build tested locally