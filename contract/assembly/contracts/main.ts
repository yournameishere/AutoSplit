import {
  Address,
  Context,
  Storage,
  generateEvent,
  transferCoins,
} from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';
import {
  Allocation,
  BASIS_POINTS,
  Payment,
  Proposal,
  ProposalVote,
  Team,
  TeamMember,
  paymentToJson,
  proposalToJson,
  teamToJson,
} from './models';
import {
  incrementCounter,
  loadPayment,
  loadProposal,
  loadTeam,
  memberTeamIds,
  ownerTeamIds,
  savePayment,
  saveProposal,
  saveTeam,
  teamExists,
  teamPaymentIds,
  teamProposalIds,
  trackMemberTeam,
  trackOwnerTeam,
} from './storage-utils';

const OWNER_KEY = 'autosplit:owner';
const TEAM_COUNTER = 'team';
const PAYMENT_COUNTER = 'payment';
const PROPOSAL_COUNTER = 'proposal';
const DEFAULT_PROPOSAL_DURATION: u64 =
  u64(3) * u64(24) * u64(60) * u64(60) * u64(1000);

export function constructor(_: StaticArray<u8>): void {
  assert(Context.isDeployingContract(), 'Already deployed');
  const owner = Context.caller().toString();
  Storage.set<string>(OWNER_KEY, owner);
  generateEvent(`autosplit:init:${owner}`);
}

export function createTeam(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const name = args.nextString().expect('Missing team name');
  const description = args
    .nextString()
    .expect('Missing team description');
  const currency = args.nextString().expect('Missing currency');
  const avatar = args.nextString().expect('Missing avatar');
  const tagsResult = args.nextStringArray();
  const slug = args.nextString().expect('Missing slug');

  assert(name.length > 0, 'Team name required');

  let tags = new Array<string>();
  if (!tagsResult.isErr()) {
    tags = tagsResult.unwrap();
  }

  const teamId = incrementCounter(TEAM_COUNTER);
  const owner = Context.caller().toString();
  const payLinkSlug =
    slug.length > 0 ? slug : `team-${teamId.toString()}`;

  const team = new Team(
    teamId,
    owner,
    name,
    description,
    currency.length > 0 ? currency : 'MASSA',
    avatar,
    tags,
    true,
    Context.timestamp(),
    payLinkSlug,
    0,
    new Array<TeamMember>(),
  );

  saveTeam(team);
  trackOwnerTeam(owner, teamId);
  generateEvent(`autosplit:team.created:${teamId.toString()}`);

  return new Args().add<u64>(teamId).serialize();
}

export function addMember(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const teamId = args.nextU64().expect('Missing team id');
  const wallet = args.nextString().expect('Missing member wallet');
  const role = args.nextString().expect('Missing role');
  const percentage = args.nextU16().expect('Missing share');

  assert(teamExists(teamId), 'Team not found');
  assert(percentage > 0, 'Share must be greater than zero');

  const team = loadTeam(teamId);
  requireTeamOwner(team);

  assert(
    findMemberIndex(team.members, wallet) == -1,
    'Member already exists',
  );

  const shareTotal: u16 = totalShare(team.members) + percentage;
  assert(
    shareTotal <= BASIS_POINTS,
    'Total split cannot exceed 100%',
  );

  team.members.push(
    new TeamMember(wallet, role, percentage, 0, 0),
  );
  saveTeam(team);
  trackMemberTeam(wallet, teamId);
  generateEvent(
    `autosplit:member.added:${teamId.toString()}:${wallet}`,
  );
}

export function setTeamStatus(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const teamId = args.nextU64().expect('Missing team id');
  const isActive = args.nextBool().expect('Missing status');

  assert(teamExists(teamId), 'Team not found');
  const team = loadTeam(teamId);
  requireTeamOwner(team);
  team.isActive = isActive;
  saveTeam(team);
  generateEvent(
    `autosplit:team.status:${teamId.toString()}:${
      isActive ? 'active' : 'paused'
    }`,
  );
}

export function payTeam(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const teamId = args.nextU64().expect('Missing team id');
  const reference = args.nextString().expect('Missing reference');
  const memoResult = args.nextString();
  const memo = memoResult.isErr() ? '' : memoResult.unwrap();

  assert(teamExists(teamId), 'Team not found');
  const team = loadTeam(teamId);
  assert(team.isActive, 'Team inactive');
  assert(team.members.length > 0, 'No members configured');

  const total = totalShare(team.members);
  assert(
    total == BASIS_POINTS,
    'Member percentages must total 100%',
  );

  const amount = Context.transferredCoins();
  assert(amount > 0, 'You must send MASSA');

  const payer = Context.caller().toString();
  const timestamp = Context.timestamp();
  let distributed: u64 = 0;

  for (let i = 0; i < team.members.length; i++) {
    const member = team.members[i];
    const share =
      (amount * <u64>member.percentage) / BASIS_POINTS;
    if (share == 0) {
      continue;
    }

    transferCoins(new Address(member.wallet), share);
    distributed += share;
    member.totalEarned += share;
    member.lastPaidAt = timestamp;
    team.members[i] = member;
  }

  const remainder = amount > distributed ? amount - distributed : 0;
  if (remainder > 0) {
    transferCoins(new Address(team.owner), remainder);
  }

  team.totalReceived += amount;
  saveTeam(team);

  const paymentId = incrementCounter(PAYMENT_COUNTER);
  const payment = new Payment(
    paymentId,
    teamId,
    payer,
    amount,
    timestamp,
    reference,
    memo,
  );
  savePayment(payment);
  generateEvent(`autosplit:payment:${paymentToJson(payment)}`);

  return new Args().add<u64>(paymentId).serialize();
}

export function createSplitProposal(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const teamId = args.nextU64().expect('Missing team id');
  const reason = args.nextString().expect('Missing reason');
  const allocationCount = args.nextU32().expect('Missing allocation size');

  assert(allocationCount > 0, 'Allocations required');
  assert(teamExists(teamId), 'Team not found');

  const team = loadTeam(teamId);
  requireTeamOwner(team);

  const allocations = new Array<Allocation>();
  let total: u16 = 0;

  for (let i: u32 = 0; i < allocationCount; i++) {
    const member = args.nextString().expect('Missing member');
    const role = args.nextString().expect('Missing role');
    const percentage = args.nextU16().expect('Missing percentage');

    total += percentage;
    allocations.push(new Allocation(member, role, percentage));
  }

  assert(total == BASIS_POINTS, 'Allocations must total 100%');

  const proposalId = incrementCounter(PROPOSAL_COUNTER);
  const proposal = new Proposal(
    proposalId,
    teamId,
    Context.caller().toString(),
    reason,
    Context.timestamp() + DEFAULT_PROPOSAL_DURATION,
    false,
    0,
    0,
    Context.timestamp(),
    allocations,
    new Array<ProposalVote>(),
  );

  saveProposal(proposal);
  generateEvent(
    `autosplit:proposal.created:${proposalId.toString()}`,
  );
  return new Args().add<u64>(proposalId).serialize();
}

export function voteOnProposal(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const proposalId = args.nextU64().expect('Missing proposal id');
  const support = args.nextBool().expect('Missing vote');

  const proposal = loadProposal(proposalId);
  assert(!proposal.executed, 'Proposal executed');
  assert(Context.timestamp() < proposal.endTime, 'Voting closed');

  const team = loadTeam(proposal.teamId);
  const voter = Context.caller().toString();
  const memberIndex = findMemberIndex(team.members, voter);
  assert(memberIndex >= 0, 'Only team members can vote');

  for (let i = 0; i < proposal.votes.length; i++) {
    assert(proposal.votes[i].voter != voter, 'Already voted');
  }

  const weight = team.members[memberIndex].percentage;
  proposal.votes.push(new ProposalVote(voter, support, weight));
  if (support) {
    proposal.yesVotes += weight;
  } else {
    proposal.noVotes += weight;
  }

  saveProposal(proposal);
  generateEvent(
    `autosplit:proposal.vote:${proposalId.toString()}:${voter}`,
  );
}

export function executeProposal(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const proposalId = args.nextU64().expect('Missing proposal id');
  const proposal = loadProposal(proposalId);

  assert(!proposal.executed, 'Proposal executed');
  assert(Context.timestamp() >= proposal.endTime, 'Voting not ended');
  assert(
    proposal.yesVotes > proposal.noVotes,
    'Proposal rejected',
  );

  const team = loadTeam(proposal.teamId);
  team.members = rebuildMembers(team, proposal.allocations);
  saveTeam(team);

  proposal.executed = true;
  saveProposal(proposal);
  generateEvent(
    `autosplit:proposal.executed:${proposalId.toString()}`,
  );
}

export function sweepTeamProposals(
  binaryArgs: StaticArray<u8>,
): void {
  const args = new Args(binaryArgs);
  const teamId = args.nextU64().expect('Missing team id');
  assert(teamExists(teamId), 'Team not found');

  const proposalIds = teamProposalIds(teamId);
  for (let i = 0; i < proposalIds.length; i++) {
    const proposal = loadProposal(proposalIds[i]);
    if (!proposal.executed && Context.timestamp() >= proposal.endTime) {
      if (proposal.yesVotes > proposal.noVotes) {
        const team = loadTeam(teamId);
        team.members = rebuildMembers(team, proposal.allocations);
        saveTeam(team);
      }
      proposal.executed = true;
      saveProposal(proposal);
      generateEvent(
        `autosplit:proposal.swept:${proposal.id.toString()}`,
      );
    }
  }
}

export function getTeam(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const teamId = args.nextU64().expect('Missing team id');
  assert(teamExists(teamId), 'Team not found');
  const team = loadTeam(teamId);
  return stringToBytes(teamToJson(team));
}

export function getOwnerTeams(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const ownerResult = args.nextString();
  const owner =
    ownerResult.isErr() || ownerResult.unwrap().length == 0
      ? Context.caller().toString()
      : ownerResult.unwrap();
  const ids = ownerTeamIds(owner);
  return stringToBytes(listTeams(ids));
}

export function getMemberTeams(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const memberResult = args.nextString();
  const member =
    memberResult.isErr() || memberResult.unwrap().length == 0
      ? Context.caller().toString()
      : memberResult.unwrap();
  const ids = memberTeamIds(member);
  return stringToBytes(listTeams(ids));
}

export function getPaymentsForTeam(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const teamId = args.nextU64().expect('Missing team id');
  const limitResult = args.nextU32();
  const limit = limitResult.isErr() ? 25 : limitResult.unwrap();

  assert(teamExists(teamId), 'Team not found');
  const ids = teamPaymentIds(teamId);
  return stringToBytes(listPayments(ids, limit));
}

export function getProposalsForTeam(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const teamId = args.nextU64().expect('Missing team id');

  assert(teamExists(teamId), 'Team not found');
  const ids = teamProposalIds(teamId);
  const team = loadTeam(teamId);
  return stringToBytes(listProposals(ids, team.name));
}

export function getConfig(_: StaticArray<u8>): StaticArray<u8> {
  const owner = Storage.get<string>(OWNER_KEY);
  const payload = `{"owner":"${owner}"}`;
  return stringToBytes(payload);
}

function requireTeamOwner(team: Team): void {
  const caller = Context.caller().toString();
  assert(caller == team.owner, 'Only team owner allowed');
}

function totalShare(members: Array<TeamMember>): u16 {
  let total: u16 = 0;
  for (let i = 0; i < members.length; i++) {
    total += members[i].percentage;
  }
  return total;
}

function findMemberIndex(
  members: Array<TeamMember>,
  wallet: string,
): i32 {
  for (let i = 0; i < members.length; i++) {
    if (members[i].wallet == wallet) {
      return i;
    }
  }
  return -1;
}

function rebuildMembers(
  team: Team,
  allocations: Array<Allocation>,
): Array<TeamMember> {
  const updated = new Array<TeamMember>();
  for (let i = 0; i < allocations.length; i++) {
    const allocation = allocations[i];
    const idx = findMemberIndex(team.members, allocation.member);
    if (idx >= 0) {
      const existing = team.members[idx];
      existing.percentage = allocation.percentage;
      existing.role = allocation.role;
      updated.push(existing);
    } else {
      updated.push(
        new TeamMember(
          allocation.member,
          allocation.role,
          allocation.percentage,
          0,
          0,
        ),
      );
    }
    trackMemberTeam(allocation.member, team.id);
  }
  return updated;
}

function listTeams(ids: Array<u64>): string {
  if (ids.length == 0) {
    return '[]';
  }
  let payload = '[';
  for (let i = 0; i < ids.length; i++) {
    if (i > 0) {
      payload += ',';
    }
    const team = loadTeam(ids[i]);
    payload += teamToJson(team);
  }
  payload += ']';
  return payload;
}

function listPayments(ids: Array<u64>, limit: u32): string {
  if (ids.length == 0) {
    return '[]';
  }

  let payload = '[';
  let added: u32 = 0;
  for (let i = <i32>ids.length - 1; i >= 0; i--) {
    if (added >= limit) {
      break;
    }
    if (added > 0) {
      payload += ',';
    }
    const payment = loadPayment(ids[i]);
    payload += paymentToJson(payment);
    added++;
    if (i == 0) {
      break;
    }
  }
  payload += ']';
  return payload;
}

function listProposals(
  ids: Array<u64>,
  teamName: string,
): string {
  if (ids.length == 0) {
    return '[]';
  }
  let payload = '[';
  for (let i = 0; i < ids.length; i++) {
    if (i > 0) {
      payload += ',';
    }
    const proposal = loadProposal(ids[i]);
    payload += proposalToJson(proposal, teamName);
  }
  payload += ']';
  return payload;
}
