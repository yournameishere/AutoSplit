const AUTOSPLIT_ADDRESS = import.meta.env.VITE_AUTOSPLIT_ADDRESS ?? '';
const NETWORK = import.meta.env.VITE_MASSA_NETWORK ?? 'buildnet';
const DEFAULT_MAX_GAS = Number(
  import.meta.env.VITE_MASSA_MAX_GAS ?? 7_000_000,
);

if (!AUTOSPLIT_ADDRESS) {
  console.warn(
    'VITE_AUTOSPLIT_ADDRESS is missing. Set it in your .env file to enable mutations.',
  );
}

export const appConfig = {
  contractAddress: AUTOSPLIT_ADDRESS,
  network: NETWORK,
  maxGas: DEFAULT_MAX_GAS,
};

