# AutoSplit Frontend (React + Vite)

The `frontend` package is a full AutoSplit dashboard that talks directly to the Massa smart contract
implemented under `contract/`.  
It delivers:

- animated landing page with product story,
- `/pay/:teamId` client experience that pulls live split data and executes `payTeam`,
- `/dashboard/owner` for creating teams, adding members, managing proposals, and deep analytics,
- `/dashboard/member` for contributors to monitor earnings and vote on proposals.

## Tech stack

- React 18 + Vite + TypeScript
- TailwindCSS, custom glassmorphism theme, Framer Motion animations
- `@tanstack/react-query` for data fetching/caching
- `@massalabs/massa-web3` for JsonRPC + SC calls
- Zustand wallet store that persists burner secret keys in `localStorage`

## Environment variables

Create a `.env` (or `.env.local`) inside `frontend/`:

```
VITE_AUTOSPLIT_ADDRESS=ASxxxxxxxxxxxxxxxxxxxxxx   # deployed AutoSplit contract
VITE_MASSA_NETWORK=buildnet                      # optional, used for display
VITE_MASSA_MAX_GAS=7000000                       # optional, default already set
```

## Commands

```sh
npm install          # install deps
npm run dev          # start Vite dev server
npm run build        # type-check + production build (already exercised in CI)
npm run lint         # eslint + @typescript-eslint
```

> **Heads up:** every state-changing call (create team/member, proposals, votes)
> automatically attaches a small 0.05 MASSA fee so there are enough coins to
> cover datastore writes. Make sure your Massa Station account holds a few
> buildnet tokens before interacting with the dashboards.

## Wallet usage

AutoSplit now talks directly to **Massa Station** via `@massalabs/wallet-provider`.

1. Install [Massa Station](https://station.massa/) and enable the “Massa Wallet” plugin.
2. Switch the wallet to the Buildnet network and make sure at least one account exists.
3. Open the dApp and click **Connect Massa Station** – the app auto-detects the running wallet and
   requests the first available account.

No private keys are ever pasted into the UI anymore. The dApp remembers that you prefer Massa Station
and silently reconnects on refresh as long as Station keeps running.

## Project layout

```
src/
  components/        # shared layout + wallet controls
  features/
    landing/         # marketing hero & timeline
    pay/             # client payment screen
    owner/           # owner dashboard forms + analytics
    member/          # member view & proposal voting
  hooks/
    useWalletStore   # Zustand wallet/session layer
  lib/
    massa.ts         # JsonRPC helpers + typed mutations
    parsers.ts       # formatting helpers (MASSA, timestamps, addresses)
    config.ts        # env guardrail
```

Happy splitting! 🌀