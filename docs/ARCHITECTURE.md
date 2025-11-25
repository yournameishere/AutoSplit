## AutoSplit Architecture

### Vision
AutoSplit is a fully on-chain revenue sharing platform for Massa. Teams define members and percentages once; every incoming payment gets split and streamed to wallets trustlessly. Governance proposals protect members from unilateral changes.

### High-Level System
- **Smart Contract (AssemblyScript, Massa SDK)**  
  Single `AutoSplit` contract storing teams, members, payments, and proposals. Handles validation, coin transfers, and emits events for indexers.
- **Frontend (React + Vite + Tailwind + Framer Motion)**  
  Deployed on Massa DeWeb/static hosting. Talks to the contract through `@massalabs/massa-web3`, wraps wallet connections, and renders dashboards for owners, members, and clients.
- **Optional Indexer/Worker (Node.js)**  
  Listens to contract events for faster analytics and notifications. Not required for MVP but hooks are documented for future use.

### Contract Modules
1. **Registry**
   - `createTeam`, `addMember`, `setTeamStatus`
   - Enforces 10,000 basis point total share.
   - Persists team metadata (name, description, avatar, tags, slug) and caches owner/member team lists for quick querying.
2. **Payment Splitter**
   - `payTeam` accepts funds, calculates each share, transfers coins instantly, and records `Payment` structs for history/analytics.
   - Keeps lifetime totals per team/member, emits `payment` events containing JSON payloads.
3. **Governance**
   - `createSplitProposal`, `voteOnProposal`, `executeProposal`, `sweepExpiredProposals`.
   - Stores proposed allocations + reason URIs, snapshots voters, and auto-updates registry when quorum met. Designed to be triggered by an Autonomous Smart Contract (ASC) message loop.

### Frontend Modules
- **Wallet Layer**  
  `WalletProvider` abstracts Massa Station / private key usage, exposing `connect`, `disconnect`, `account`, `signer`, and `callSC` helpers.
- **Data Layer**  
  `massaClient` wrapper builds read/write calls (Args encoding/decoding) and caches via React Query. All numeric values normalized to `BigInt`.
- **Routes**
  - `/` Landing page with animated hero, overview, CTA.
  - `/pay/:teamId` Shimmer card, real-time contract data, amount input, Massa pay modal.
  - `/dashboard/owner/*` Teal-glass UI covering overview, teams, members, payments, proposals, settings.
  - `/dashboard/member/*` Focused on earnings, payment history, proposal voting.
- **UI System**  
  Tailwind theme + CSS variables for light/dark gradient, shared components (Cards, Stat widgets, Split progress bars). Framer Motion handles transitions & micro-interactions, while Lottie + SVGs cover hero animations.

### Data Flow
1. Owner connects wallet → `createTeam` mutation → Tx hash surfaced in toasts.
2. Owner adds members (client-side validation + contract enforcement). App refreshes team cache via `invalidateQueries`.
3. Client visits `/pay/:teamId`, amount -> contract call `payTeam`. Smart contract transfers coins instantly and emits `Payment` event.
4. Member dashboards query `getMemberTeams` + `getPaymentsForMember`. Governance tab subscribes to proposals, lets members vote, and polls for ASC execution.

### External References
- Massa smart-contract docs (constructor guarantees, datastore, Context APIs).
- Massa Web3 SDK (JsonRpcProvider, SmartContract.call, Args helper).
- Massa Station wallet provider for user-friendly signing flow.

This architecture keeps everything self-contained on Massa while remaining modular enough to add analytics/indexers later.


