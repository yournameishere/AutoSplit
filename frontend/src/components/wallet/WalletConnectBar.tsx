import { FormEvent, useState } from 'react';
import { shortAddress } from '../../lib/parsers';
import { useWalletStore } from '../../hooks/useWalletStore';

export default function WalletConnectBar() {
  const { status, address, connect, disconnect, error } =
    useWalletStore();
  const [secret, setSecret] = useState('');
  const [expanded, setExpanded] = useState(false);

  const isConnected = status === 'connected' && !!address;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!secret.trim()) return;
    await connect(secret.trim());
    setSecret('');
    setExpanded(false);
  };

  return (
    <div className="glass relative rounded-2xl px-4 py-3 text-sm shadow-card">
      {!isConnected ? (
        <div>
          <button
            className="rounded-full bg-gradient-to-r from-aurora to-sunset px-4 py-2 text-sm font-semibold text-night shadow-lg transition hover:scale-[1.01]"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
          </button>
          {expanded && (
            <form
              onSubmit={handleSubmit}
              className="mt-3 flex flex-col gap-2 text-xs text-white/80"
            >
              <label className="text-white/60">
                Paste your buildnet secret key (test wallets only)
              </label>
              <input
                type="password"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-aurora focus:outline-none"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder="AU..."
              />
              <p className="text-white/40">
                Keys are stored locally. Use burner keys only.
              </p>
              <button
                type="submit"
                className="rounded-full bg-white/90 px-3 py-1.5 font-semibold text-night"
                disabled={status === 'connecting'}
              >
                Connect
              </button>
              {error && (
                <span className="text-red-400">Error: {error}</span>
              )}
            </form>
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


