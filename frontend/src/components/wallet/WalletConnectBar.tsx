import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { shortAddress } from '../../lib/parsers';
import { useWalletStore } from '../../hooks/useWalletStore';

const STATION_URL = 'https://station.massa/';

export default function WalletConnectBar() {
  const { status, address, connect, disconnect, error } =
    useWalletStore();
  const [localError, setLocalError] = useState<string>();

  const isConnected = status === 'connected' && !!address;

  const handleConnect = async () => {
    setLocalError(undefined);
    try {
      await connect();
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  return (
    <div className="glass relative rounded-2xl px-4 py-3 text-sm shadow-card">
      {!isConnected ? (
        <div className="space-y-3">
          <button
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-aurora to-sunset px-4 py-2 text-sm font-semibold text-night shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleConnect}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting…
              </>
            ) : (
              'Connect Massa Station'
            )}
          </button>
          <p className="text-xs text-white/60">
            Requires{' '}
            <a
              href={STATION_URL}
              target="_blank"
              rel="noreferrer"
              className="text-aurora underline underline-offset-2"
            >
              Massa Station
            </a>{' '}
            with the Massa Wallet plugin enabled on buildnet.
          </p>
          {(error || localError) && (
            <p className="text-xs text-red-400">
              {localError ?? error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/60">
              Connected
            </div>
            <div className="font-semibold">{shortAddress(address)}</div>
          </div>
          <button
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 hover:text-white"
            onClick={() => disconnect()}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
