# AutoSplit Massa Smart Contract

The AssemblyScript contract located under `assembly/contracts` powers the AutoSplit dApp.  
It tracks teams, members, instant payment splits, on-chain governance proposals, and exposes JSON-first
view functions for the React frontend.

## Entrypoints

| Function | Purpose |
| --- | --- |
| `createTeam(name, description, currency, avatar, tags[], slug)` | Deploys a new team owned by the caller. |
| `addMember(teamId, wallet, role, percentage)` | Owner-only. Adds a member expressed in basis points (10_000 = 100%). |
| `setTeamStatus(teamId, isActive)` | Pause/resume incoming payments. |
| `payTeam(teamId, reference, memo)` | Payable. Splits `msg.value` instantly across members and records a payment struct. |
| `createSplitProposal(teamId, reason, allocations[])` | Owner creates governance proposal for new splits. |
| `voteOnProposal(proposalId, support)` | Any team member can vote. Weight = member percentage. |
| `executeProposal(proposalId)` / `sweepTeamProposals(teamId)` | Applies approved proposals once the deadline passes. |
| `getTeam(teamId)` | Returns a JSON blob describing the team + members. |
| `getOwnerTeams(address?)`, `getMemberTeams(address?)` | Convenience JSON lists (address optional, defaults to caller). |
| `getPaymentsForTeam(teamId, limit)` / `getProposalsForTeam(teamId)` | Paged JSON history endpoints. |
| `getConfig()` | Returns contract metadata (current platform owner). |

Datastore layout lives in `storage-utils.ts` and uses prefixed keys (`autosplit:*`) to prevent collisions.

## Build

```shell
npm install
npm run build
```

## Deploy

1. Create `contract/.env` with:

```
WALLET_SECRET_KEY="AU..."
JSON_RPC_URL_PUBLIC="https://buildnet.massa.net/api/v2:33035"
```

2. Compile & deploy:

```shell
npm run deploy
```

`src/deploy.ts` already points to `build/main.wasm`. Adjust it if you rename the contract artifact or want to
seed constructor arguments.

## Testing & Formatting

```shell
npm run test   # as-pect unit tests
npm run fmt    # format AssemblyScript sources
```
