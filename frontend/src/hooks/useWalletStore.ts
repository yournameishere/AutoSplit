import { create } from 'zustand';
import type { Account, SmartContract } from '@massalabs/massa-web3';
import {
  getAccountFromSecret,
  getWritableContract,
} from '../lib/massa';

type WalletState = {
  account?: Account;
  contract?: SmartContract;
  address?: string;
  status: 'idle' | 'connecting' | 'connected';
  error?: string;
  connect: (secretKey: string) => Promise<void>;
  disconnect: () => void;
};

export const useWalletStore = create<WalletState>((set) => ({
  status: 'idle',
  async connect(secretKey: string) {
    set({ status: 'connecting', error: undefined });
    try {
      const account = await getAccountFromSecret(secretKey);
      const contract = getWritableContract(account);
      set({
        account,
        contract,
        address: account.address.toString(),
        status: 'connected',
      });
      localStorage.setItem('autosplit:sk', secretKey);
    } catch (error) {
      set({
        account: undefined,
        contract: undefined,
        status: 'idle',
        error: (error as Error).message,
      });
      throw error;
    }
  },
  disconnect() {
    localStorage.removeItem('autosplit:sk');
    set({
      account: undefined,
      contract: undefined,
      address: undefined,
      status: 'idle',
      error: undefined,
    });
  },
}));

export function restoreWalletSession() {
  const secret = localStorage.getItem('autosplit:sk');
  if (!secret) return;
  const { connect, status } = useWalletStore.getState();
  if (status === 'connected') return;
  connect(secret).catch(() => {
    useWalletStore.getState().disconnect();
  });
}


