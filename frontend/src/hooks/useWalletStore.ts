import { create } from 'zustand';
import type { Provider, SmartContract } from '@massalabs/massa-web3';
import {
  connectMassaStationAccount,
  getContractFromProvider,
} from '../lib/massa';

const LOCAL_STORAGE_KEY = 'autosplit:wallet';

type WalletState = {
  provider?: Provider;
  contract?: SmartContract;
  address?: string;
  status: 'idle' | 'connecting' | 'connected';
  error?: string;
  connect: () => Promise<void>;
  disconnect: () => void;
};

export const useWalletStore = create<WalletState>((set) => ({
  status: 'idle',
  async connect() {
    set({ status: 'connecting', error: undefined });
    try {
      const provider = await connectMassaStationAccount();
      const contract = getContractFromProvider(provider);
      set({
        provider,
        contract,
        address: provider.address,
        status: 'connected',
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, 'massa-station');
    } catch (error) {
      set({
        provider: undefined,
        contract: undefined,
        address: undefined,
        status: 'idle',
        error: (error as Error).message,
      });
      throw error;
    }
  },
  disconnect() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    set({
      provider: undefined,
      contract: undefined,
      address: undefined,
      status: 'idle',
      error: undefined,
    });
  },
}));

export function restoreWalletSession() {
  const wantsAutoConnect = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!wantsAutoConnect) return;
  const { connect, status } = useWalletStore.getState();
  if (status === 'connected' || status === 'connecting') {
    return;
  }
  connect().catch(() => {
    useWalletStore.getState().disconnect();
  });
}
