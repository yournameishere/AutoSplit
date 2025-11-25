# AutoSplit – Massa-native Revenue Splits

<img src="frontend/src/features/images (2).png" alt="AutoSplit" width="160" />

AutoSplit is an end-to-end revenue sharing dApp that lives entirely on the
Massa blockchain. Every team gets its own smart-contract controlled wallet:
when a client pays, coins are instantly split between members according to
their on-chain percentages, and any future changes must pass a DAO-like vote.

## What the app does

- **Instant payouts:** `payTeam` receives MASSA, calculates each share in basis
  points, and transfers coins to every member within the same transaction.
- **Governed changes:** Owners can’t arbitrarily edit percentages—split updates
  are proposals that team members vote on, and an autonomous contract applies
  results after the deadline.
- **On-chain analytics:** Every payment, member, and proposal is persisted in
  the contract datastore so the frontend can show lifetime totals without
  relying on an off-chain DB.
- **Role-specific dashboards:** Clients see a pay page, owners manage teams,
  and contributors track earnings + vote on proposals, all powered by the Massa
  contract responses.

## How it works (end-to-end)

- **Owner creates a team** in the dashboard and adds members with their shares.
- **Owner shares a pay link or QR** with the client (`/pay/:teamId`).
- **Client pays in MASSA**; the contract validates that the split totals 100% and
  transfers each member’s share instantly.
- **Members** see updated earnings and can **vote on proposals** to change splits.
- **ASC** automatically executes approved proposals once voting ends.

## Built on Massa

- **Smart contract:** AssemblyScript contract (`contract/assembly/contracts`)
  manages teams, members, payment history, and governance logic using the
  Massa SDK (`@massalabs/massa-as-sdk`). Storage fees are covered by the caller,
  and events are emitted for indexers.
- **Deployment tooling:** `npm run deploy` in `contract/` compiles the WASM and
  deploys via `@massalabs/massa-web3`, reading wallet secrets + RPC URL from
  `.env`. The repo already targets the Buildnet endpoint.
- **Frontend integration:** The React client calls smart-contract functions
  through `SmartContract.call/read`. Mutations automatically attach a small
  coin allowance (0.05 MASSA) to pay storage costs, ensuring calls succeed on
  chain.
- **Wallet provider:** The UI connects directly to Massa Station using
  `@massalabs/wallet-provider`, so users approve transactions with their
  Station-managed Buildnet accounts—no private keys pasted into the browser.

## Tech stack

- **Smart contract:** AssemblyScript, Massa SDK, as-pect for tests
- **Frontend:** React 18 + Vite, TailwindCSS, Framer Motion, React Query
- **Web3 tooling:** `@massalabs/massa-web3`, `@massalabs/wallet-provider`,
  `@massalabs/react-ui-kit`

## Local development

```bash
# Contracts
cd contract
npm install
npm run build
npm run deploy     # requires WALLET_SECRET_KEY + JSON_RPC_URL_PUBLIC in .env

# Frontend
cd ../frontend
npm install
cp .env.example .env  # set VITE_AUTOSPLIT_ADDRESS to the deployed address
npm run dev
```

Before calling mutations such as `createTeam`, ensure your Massa Station account
has enough Buildnet MAS to cover storage fees—the UI will automatically send
the required coins with each transaction.

## Connecting the frontend to your deployed contract

- Set `VITE_AUTOSPLIT_ADDRESS` in `frontend/.env` to the deployed contract address.
- Start Massa Station and enable the Massa Wallet plugin.
- Use the Owner dashboard to create teams and configure splits.

## Production readiness checklist

- ✅ Smart contract deployed on Massa buildnet (address recorded in `.env`)
- ✅ Frontend uses Massa Station for auth & signing
- ✅ Storage fees automatically handled for state-changing calls
- ✅ Build + type-check pipelines (`npm run build` in both folders) green
- ✅ Docs describing architecture (`docs/ARCHITECTURE.md`) + this README

With those pieces in place, AutoSplit is ready for hackathons or production
pilots on Massa’s trustless infrastructure. Tailor the UI colors/content as
needed, redeploy the contract when iterating, and point `VITE_AUTOSPLIT_ADDRESS`
to the latest buildnet address. Enjoy the splits! 🚀

