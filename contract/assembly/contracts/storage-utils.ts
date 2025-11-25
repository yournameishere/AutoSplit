import { Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';
import { Payment, Proposal, Team } from './models';

const PREFIX = 'autosplit:';

function prefixed(key: string): string {
  return PREFIX + key;
}

function keyBytes(key: string): StaticArray<u8> {
  return stringToBytes(prefixed(key));
}

function writeBytes(key: string, value: StaticArray<u8>): void {
  Storage.set<StaticArray<u8>>(keyBytes(key), value);
}

function readBytes(key: string): StaticArray<u8> {
  return Storage.get<StaticArray<u8>>(keyBytes(key));
}

function hasKey(key: string): bool {
  return Storage.has<StaticArray<u8>>(keyBytes(key));
}

export function writeCounter(key: string, value: u64): void {
  const args = new Args().add<u64>(value);
  writeBytes(`counter:${key}`, args.serialize());
}

export function readCounter(key: string): u64 {
  const storageKey = `counter:${key}`;
  if (!hasKey(storageKey)) {
    return 0;
  }
  const args = new Args(readBytes(storageKey));
  return args.nextU64().expect('Cannot read counter');
}

export function incrementCounter(key: string): u64 {
  const current = readCounter(key);
  const next = current + 1;
  writeCounter(key, next);
  return next;
}

export function saveTeam(team: Team): void {
  writeBytes(teamKey(team.id), team.serialize());
}

export function loadTeam(teamId: u64): Team {
  return Team.deserialize(readBytes(teamKey(teamId)));
}

export function teamExists(teamId: u64): bool {
  return hasKey(teamKey(teamId));
}

export function trackOwnerTeam(owner: string, teamId: u64): void {
  appendUniqueId(ownerTeamsKey(owner), teamId);
}

export function ownerTeamIds(owner: string): Array<u64> {
  return readIdArray(ownerTeamsKey(owner));
}

export function trackMemberTeam(member: string, teamId: u64): void {
  appendUniqueId(memberTeamsKey(member), teamId);
}

export function memberTeamIds(member: string): Array<u64> {
  return readIdArray(memberTeamsKey(member));
}

export function savePayment(payment: Payment): void {
  writeBytes(paymentKey(payment.id), payment.serialize());
  appendUniqueId(teamPaymentsKey(payment.teamId), payment.id);
}

export function loadPayment(paymentId: u64): Payment {
  return Payment.deserialize(readBytes(paymentKey(paymentId)));
}

export function teamPaymentIds(teamId: u64): Array<u64> {
  return readIdArray(teamPaymentsKey(teamId));
}

export function saveProposal(proposal: Proposal): void {
  writeBytes(proposalKey(proposal.id), proposal.serialize());
  appendUniqueId(teamProposalsKey(proposal.teamId), proposal.id);
}

export function loadProposal(proposalId: u64): Proposal {
  return Proposal.deserialize(readBytes(proposalKey(proposalId)));
}

export function teamProposalIds(teamId: u64): Array<u64> {
  return readIdArray(teamProposalsKey(teamId));
}

function appendUniqueId(key: string, value: u64): void {
  const ids = readIdArray(key);
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] == value) {
      return;
    }
  }
  ids.push(value);
  storeIdArray(key, ids);
}

function readIdArray(key: string): Array<u64> {
  if (!hasKey(key)) {
    return new Array<u64>();
  }

  const args = new Args(readBytes(key));
  const values = args
    .nextFixedSizeArray<u64>()
    .expect('Cannot read id array from storage');
  const ids = new Array<u64>();
  for (let i = 0; i < values.length; i++) {
    ids.push(values[i]);
  }
  return ids;
}

function storeIdArray(key: string, values: Array<u64>): void {
  const args = new Args().add<Array<u64>>(values);
  writeBytes(key, args.serialize());
}

function teamKey(teamId: u64): string {
  return `team:${teamId.toString()}`;
}

function ownerTeamsKey(owner: string): string {
  return `owner-teams:${owner}`;
}

function memberTeamsKey(member: string): string {
  return `member-teams:${member}`;
}

function paymentKey(paymentId: u64): string {
  return `payment:${paymentId.toString()}`;
}

function teamPaymentsKey(teamId: u64): string {
  return `team-payments:${teamId.toString()}`;
}

function proposalKey(proposalId: u64): string {
  return `proposal:${proposalId.toString()}`;
}

function teamProposalsKey(teamId: u64): string {
  return `team-proposals:${teamId.toString()}`;
}


