import { Args } from '@massalabs/as-types';

export const BASIS_POINTS: u16 = 10000;

export class TeamMember {
  constructor(
    public wallet: string = '',
    public role: string = '',
    public percentage: u16 = 0,
    public totalEarned: u64 = 0,
    public lastPaidAt: u64 = 0,
  ) {}
}

export class Team {
  constructor(
    public id: u64 = 0,
    public owner: string = '',
    public name: string = '',
    public description: string = '',
    public currency: string = 'MASSA',
    public avatar: string = '',
    public tags: Array<string> = [],
    public isActive: bool = true,
    public createdAt: u64 = 0,
    public payLinkSlug: string = '',
    public totalReceived: u64 = 0,
    public members: Array<TeamMember> = [],
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args()
      .add<u64>(this.id)
      .add(this.owner)
      .add(this.name)
      .add(this.description)
      .add(this.currency)
      .add(this.avatar)
      .add<Array<string>>(this.tags)
      .add<bool>(this.isActive)
      .add<u64>(this.createdAt)
      .add(this.payLinkSlug)
      .add<u64>(this.totalReceived);

    serializeMembers(args, this.members);
    return args.serialize();
  }

  static deserialize(data: StaticArray<u8>): Team {
    const args = new Args(data);
    const id = args.nextU64().expect('Missing team id');
    const owner = args.nextString().expect('Missing owner');
    const name = args.nextString().expect('Missing name');
    const description = args.nextString().expect('Missing description');
    const currency = args.nextString().expect('Missing currency');
    const avatar = args.nextString().expect('Missing avatar');
    const tags = args.nextStringArray().expect('Missing tags');
    const isActive = args.nextBool().expect('Missing status');
    const createdAt = args.nextU64().expect('Missing createdAt');
    const payLinkSlug = args.nextString().expect('Missing slug');
    const totalReceived = args.nextU64().expect('Missing totalReceived');
    const members = deserializeMembers(args);

    return new Team(
      id,
      owner,
      name,
      description,
      currency,
      avatar,
      tags,
      isActive,
      createdAt,
      payLinkSlug,
      totalReceived,
      members,
    );
  }
}

export class Payment {
  constructor(
    public id: u64 = 0,
    public teamId: u64 = 0,
    public payer: string = '',
    public amount: u64 = 0,
    public timestamp: u64 = 0,
    public reference: string = '',
    public memo: string = '',
  ) {}

  serialize(): StaticArray<u8> {
    return new Args()
      .add<u64>(this.id)
      .add<u64>(this.teamId)
      .add(this.payer)
      .add<u64>(this.amount)
      .add<u64>(this.timestamp)
      .add(this.reference)
      .add(this.memo)
      .serialize();
  }

  static deserialize(data: StaticArray<u8>): Payment {
    const args = new Args(data);
    const id = args.nextU64().expect('Missing payment id');
    const teamId = args.nextU64().expect('Missing payment teamId');
    const payer = args.nextString().expect('Missing payer');
    const amount = args.nextU64().expect('Missing amount');
    const timestamp = args.nextU64().expect('Missing timestamp');
    const reference = args.nextString().expect('Missing reference');
    const memo = args.nextString().expect('Missing memo');
    return new Payment(id, teamId, payer, amount, timestamp, reference, memo);
  }
}

export class Allocation {
  constructor(
    public member: string = '',
    public role: string = '',
    public percentage: u16 = 0,
  ) {}
}

export class ProposalVote {
  constructor(
    public voter: string = '',
    public support: bool = false,
    public weight: u16 = 0,
  ) {}
}

export class Proposal {
  constructor(
    public id: u64 = 0,
    public teamId: u64 = 0,
    public creator: string = '',
    public reason: string = '',
    public endTime: u64 = 0,
    public executed: bool = false,
    public yesVotes: u32 = 0,
    public noVotes: u32 = 0,
    public createdAt: u64 = 0,
    public allocations: Array<Allocation> = [],
    public votes: Array<ProposalVote> = [],
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args()
      .add<u64>(this.id)
      .add<u64>(this.teamId)
      .add(this.creator)
      .add(this.reason)
      .add<u64>(this.endTime)
      .add<bool>(this.executed)
      .add<u32>(this.yesVotes)
      .add<u32>(this.noVotes)
      .add<u64>(this.createdAt);

    serializeAllocations(args, this.allocations);
    serializeVotes(args, this.votes);
    return args.serialize();
  }

  static deserialize(data: StaticArray<u8>): Proposal {
    const args = new Args(data);
    const id = args.nextU64().expect('Missing proposal id');
    const teamId = args.nextU64().expect('Missing proposal teamId');
    const creator = args.nextString().expect('Missing creator');
    const reason = args.nextString().expect('Missing reason');
    const endTime = args.nextU64().expect('Missing endTime');
    const executed = args.nextBool().expect('Missing executed flag');
    const yesVotes = args.nextU32().expect('Missing yesVotes');
    const noVotes = args.nextU32().expect('Missing noVotes');
    const createdAt = args.nextU64().expect('Missing createdAt');
    const allocations = deserializeAllocations(args);
    const votes = deserializeVotes(args);
    return new Proposal(
      id,
      teamId,
      creator,
      reason,
      endTime,
      executed,
      yesVotes,
      noVotes,
      createdAt,
      allocations,
      votes,
    );
  }
}

export function teamToJson(team: Team): string {
  const tagsJson = stringArrayToJson(team.tags);
  const membersJson = '[' + membersToJson(team.members) + ']';
  return (
    '{' +
    `"id":"${team.id.toString()}",` +
    `"owner":"${team.owner}",` +
    `"name":"${escapeJson(team.name)}",` +
    `"description":"${escapeJson(team.description)}",` +
    `"currency":"${team.currency}",` +
    `"avatar":"${escapeJson(team.avatar)}",` +
    `"tags":${tagsJson},` +
    `"isActive":${team.isActive ? 'true' : 'false'},` +
    `"createdAt":"${team.createdAt.toString()}",` +
    `"payLinkSlug":"${escapeJson(team.payLinkSlug)}",` +
    `"totalReceived":"${team.totalReceived.toString()}",` +
    `"members":${membersJson}` +
    '}'
  );
}

export function paymentToJson(payment: Payment): string {
  return (
    '{' +
    `"id":"${payment.id.toString()}",` +
    `"teamId":"${payment.teamId.toString()}",` +
    `"payer":"${payment.payer}",` +
    `"amount":"${payment.amount.toString()}",` +
    `"timestamp":"${payment.timestamp.toString()}",` +
    `"reference":"${escapeJson(payment.reference)}",` +
    `"memo":"${escapeJson(payment.memo)}"` +
    '}'
  );
}

export function proposalToJson(
  proposal: Proposal,
  teamName: string,
): string {
  return (
    '{' +
    `"id":"${proposal.id.toString()}",` +
    `"teamId":"${proposal.teamId.toString()}",` +
    `"teamName":"${escapeJson(teamName)}",` +
    `"creator":"${proposal.creator}",` +
    `"reason":"${escapeJson(proposal.reason)}",` +
    `"endTime":"${proposal.endTime.toString()}",` +
    `"executed":${proposal.executed ? 'true' : 'false'},` +
    `"yesVotes":${proposal.yesVotes.toString()},` +
    `"noVotes":${proposal.noVotes.toString()},` +
    `"createdAt":"${proposal.createdAt.toString()}",` +
    `"allocations":[${allocationsToJson(proposal.allocations)}],` +
    `"votes":[${votesToJson(proposal.votes)}]` +
    '}'
  );
}

function membersToJson(members: Array<TeamMember>): string {
  if (!members.length) {
    return '';
  }

  let buff = '';
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (i > 0) buff += ',';
    buff +=
      '{' +
      `"wallet":"${member.wallet}",` +
      `"role":"${escapeJson(member.role)}",` +
      `"percentage":${member.percentage.toString()},` +
      `"totalEarned":"${member.totalEarned.toString()}",` +
      `"lastPaidAt":"${member.lastPaidAt.toString()}"` +
      '}';
  }
  return buff;
}

function allocationsToJson(allocations: Array<Allocation>): string {
  if (!allocations.length) {
    return '';
  }
  let buff = '';
  for (let i = 0; i < allocations.length; i++) {
    const allocation = allocations[i];
    if (i > 0) buff += ',';
    buff +=
      '{' +
      `"member":"${allocation.member}",` +
      `"role":"${escapeJson(allocation.role)}",` +
      `"percentage":${allocation.percentage.toString()}` +
      '}';
  }
  return buff;
}

function votesToJson(votes: Array<ProposalVote>): string {
  if (!votes.length) {
    return '';
  }
  let buff = '';
  for (let i = 0; i < votes.length; i++) {
    const vote = votes[i];
    if (i > 0) buff += ',';
    buff +=
      '{' +
      `"voter":"${vote.voter}",` +
      `"support":${vote.support ? 'true' : 'false'},` +
      `"weight":${vote.weight.toString()}` +
      '}';
  }
  return buff;
}

function serializeMembers(args: Args, members: Array<TeamMember>): void {
  args.add<u32>(members.length);
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    args
      .add(member.wallet)
      .add(member.role)
      .add<u16>(member.percentage)
      .add<u64>(member.totalEarned)
      .add<u64>(member.lastPaidAt);
  }
}

function deserializeMembers(args: Args): Array<TeamMember> {
  const count = args.nextU32().expect('Missing members length');
  const members = new Array<TeamMember>();
  for (let i: u32 = 0; i < count; i++) {
    const wallet = args.nextString().expect('Missing member wallet');
    const role = args.nextString().expect('Missing member role');
    const percentage = args.nextU16().expect('Missing member share');
    const totalEarned = args.nextU64().expect('Missing member total earned');
    const lastPaidAt = args.nextU64().expect('Missing member last paid');
    members.push(
      new TeamMember(wallet, role, percentage, totalEarned, lastPaidAt),
    );
  }
  return members;
}

function serializeAllocations(args: Args, allocations: Array<Allocation>): void {
  args.add<u32>(allocations.length);
  for (let i = 0; i < allocations.length; i++) {
    const allocation = allocations[i];
    args.add(allocation.member).add(allocation.role).add<u16>(allocation.percentage);
  }
}

function deserializeAllocations(args: Args): Array<Allocation> {
  const count = args.nextU32().expect('Missing allocations length');
  const allocations = new Array<Allocation>();
  for (let i: u32 = 0; i < count; i++) {
    const member = args.nextString().expect('Missing allocation member');
    const role = args.nextString().expect('Missing allocation role');
    const percentage = args.nextU16().expect('Missing allocation percentage');
    allocations.push(new Allocation(member, role, percentage));
  }
  return allocations;
}

function serializeVotes(args: Args, votes: Array<ProposalVote>): void {
  args.add<u32>(votes.length);
  for (let i = 0; i < votes.length; i++) {
    const vote = votes[i];
    args.add(vote.voter).add<bool>(vote.support).add<u16>(vote.weight);
  }
}

function deserializeVotes(args: Args): Array<ProposalVote> {
  const count = args.nextU32().expect('Missing votes length');
  const votes = new Array<ProposalVote>();
  for (let i: u32 = 0; i < count; i++) {
    const voter = args.nextString().expect('Missing voter');
    const support = args.nextBool().expect('Missing support');
    const weight = args.nextU16().expect('Missing vote weight');
    votes.push(new ProposalVote(voter, support, weight));
  }
  return votes;
}

export function escapeJson(value: string): string {
  if (value.length === 0) {
    return '';
  }

  let result = '';
  for (let i = 0; i < value.length; i++) {
    const ch = value.charCodeAt(i);
    if (ch == 34) {
      result += '\\"';
    } else if (ch == 92) {
      result += '\\\\';
    } else if (ch == 10) {
      result += '\\n';
    } else if (ch == 13) {
      result += '\\r';
    } else if (ch == 9) {
      result += '\\t';
    } else {
      result += value.charAt(i);
    }
  }
  return result;
}

function stringArrayToJson(values: Array<string>): string {
  if (!values.length) {
    return '[]';
  }
  let buff = '[';
  for (let i = 0; i < values.length; i++) {
    if (i > 0) {
      buff += ',';
    }
    buff += `"${escapeJson(values[i])}"`;
  }
  buff += ']';
  return buff;
}

