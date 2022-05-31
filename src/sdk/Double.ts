import { Contract } from 'ethers';
import { useVaultManagerContract } from 'hooks/useContract'

export class DoubleFinance {
    vaultManager: Contract;

    constructor() {
        this.vaultManager = useVaultManagerContract()!;
    }

    removeLiquidity(tokenA: string, tokenB: string, bundleID: any, amount: any) {
        return this.vaultManager.removeLiquidity(tokenA, tokenB, bundleID, amount);
    }

    addLiquidity(tokenA: string, tokenAQty: string, tokenB: string) {
        return this.vaultManager.addLiquidity(tokenA, tokenAQty, tokenB);
    }
} 