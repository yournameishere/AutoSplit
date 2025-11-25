import {
  Args,
  ArrayTypes,
  JsonRpcProvider,
  JsonRPCClient,
  Mas,
  SmartContract,
  bytesToStr,
  type Provider,
} from '@massalabs/massa-web3';
import {
  WalletName,
  getWallet,
  isMassaStationAvailable,
  isMassaWalletEnabled,
} from '@massalabs/wallet-provider';
import { appConfig } from './config';
import type {
  Payment,
  Proposal,
  Team,
} from '../types/contracts';

const jsonClient = JsonRPCClient.buildnet();
const readProvider = JsonRpcProvider.buildnet();
const STORAGE_FEE = Mas.fromString('0.05'); // covers datastore writes per mutation

const readContract = () =>
  new SmartContract(readProvider, appConfig.contractAddress);

export async function fetchTeam(teamId: string | number): Promise<Team> {
  const args = new Args().addU64(BigInt(teamId));
  const res = await readContract().read('getTeam', args);
  return JSON.parse(bytesToStr(res.value)) as Team;
}

export async function fetchOwnerTeams(
  owner: string,
): Promise<Team[]> {
  const args = new Args().addString(owner ?? '');
  const res = await readContract().read('getOwnerTeams', args);
  return JSON.parse(bytesToStr(res.value)) as Team[];
}

export async function fetchMemberTeams(
  wallet: string,
): Promise<Team[]> {
  const args = new Args().addString(wallet ?? '');
  const res = await readContract().read('getMemberTeams', args);
  return JSON.parse(bytesToStr(res.value)) as Team[];
}

export async function fetchPayments(
  teamId: string | number,
  limit = 25,
): Promise<Payment[]> {
  const args = new Args()
    .addU64(BigInt(teamId))
    .addU32(BigInt(limit));
  const res = await readContract().read('getPaymentsForTeam', args);
  return JSON.parse(bytesToStr(res.value)) as Payment[];
}

export async function fetchProposals(
  teamId: string | number,
): Promise<Proposal[]> {
  const args = new Args().addU64(BigInt(teamId));
  const res = await readContract().read('getProposalsForTeam', args);
  return JSON.parse(bytesToStr(res.value)) as Proposal[];
}

export async function fetchConfig(): Promise<{
  owner: string;
}> {
  const res = await readContract().read('getConfig');
  return JSON.parse(bytesToStr(res.value)) as { owner: string };
}

async function ensureMassaStationReady() {
  const stationAvailable = await isMassaStationAvailable();
  if (!stationAvailable) {
    throw new Error(
      'Massa Station is not running. Please launch Massa Station and try again.',
    );
  }

  const walletEnabled = await isMassaWalletEnabled();
  if (!walletEnabled) {
    throw new Error(
      'Massa Wallet plugin not detected. Enable the wallet inside Massa Station.',
    );
  }
}

export async function connectMassaStationAccount(): Promise<Provider> {
  await ensureMassaStationReady();
  const wallet = await getWallet(WalletName.MassaWallet);
  if (!wallet) {
    throw new Error('Unable to find Massa Station wallet provider.');
  }

  await wallet.connect();
  const accounts = await wallet.accounts();
  if (!accounts.length) {
    throw new Error('No accounts found in Massa Station.');
  }
  return accounts[0];
}

export function getContractFromProvider(provider: Provider) {
  if (!appConfig.contractAddress) {
    throw new Error(
      'Missing contract address. Set VITE_AUTOSPLIT_ADDRESS in your .env file.',
    );
  }
  return new SmartContract(provider, appConfig.contractAddress);
}

export interface CreateTeamInput {
  name: string;
  description: string;
  currency: string;
  avatar: string;
  tags: string[];
  slug: string;
}

export interface AddMemberInput {
  teamId: string | number;
  wallet: string;
  role: string;
  percentage: number;
}

export interface PayTeamInput {
  teamId: string | number;
  reference: string;
  memo?: string;
  amount: string;
}

export interface ProposalInput {
  teamId: string | number;
  reason: string;
  allocations: Array<{
    wallet: string;
    role: string;
    percentage: number;
  }>;
}

export async function createTeamMutation(
  sc: SmartContract,
  payload: CreateTeamInput,
) {
  const args = new Args()
    .addString(payload.name)
    .addString(payload.description)
    .addString(payload.currency)
    .addString(payload.avatar)
    .addArray(payload.tags ?? [], ArrayTypes.STRING)
    .addString(payload.slug);

  return sc.call('createTeam', args, { coins: STORAGE_FEE });
}

export async function addMemberMutation(
  sc: SmartContract,
  payload: AddMemberInput,
) {
  const args = new Args()
    .addU64(BigInt(payload.teamId))
    .addString(payload.wallet)
    .addString(payload.role)
    .addU16(BigInt(payload.percentage));

  return sc.call('addMember', args, { coins: STORAGE_FEE });
}

export async function toggleTeamStatus(
  sc: SmartContract,
  teamId: string | number,
  isActive: boolean,
) {
  const args = new Args()
    .addU64(BigInt(teamId))
    .addBool(isActive);
  return sc.call('setTeamStatus', args, { coins: STORAGE_FEE });
}

export async function payTeamMutation(
  sc: SmartContract,
  payload: PayTeamInput,
) {
  const args = new Args()
    .addU64(BigInt(payload.teamId))
    .addString(payload.reference)
    .addString(payload.memo ?? '');

  return sc.call('payTeam', args, {
    coins: Mas.fromString(payload.amount),
  });
}

export async function createProposalMutation(
  sc: SmartContract,
  payload: ProposalInput,
) {
  const args = new Args()
    .addU64(BigInt(payload.teamId))
    .addString(payload.reason)
    .addU32(BigInt(payload.allocations.length));

  payload.allocations.forEach((allocation) => {
    args
      .addString(allocation.wallet)
      .addString(allocation.role)
      .addU16(BigInt(allocation.percentage));
  });

  return sc.call('createSplitProposal', args, { coins: STORAGE_FEE });
}

export async function voteOnProposal(
  sc: SmartContract,
  proposalId: string | number,
  support: boolean,
) {
  const args = new Args()
    .addU64(BigInt(proposalId))
    .addBool(support);
  return sc.call('voteOnProposal', args, { coins: STORAGE_FEE });
}

export async function executeProposal(
  sc: SmartContract,
  proposalId: string | number,
) {
  const args = new Args().addU64(BigInt(proposalId));
  return sc.call('executeProposal', args, { coins: STORAGE_FEE });
}

export async function sweepProposals(
  sc: SmartContract,
  teamId: string | number,
) {
  const args = new Args().addU64(BigInt(teamId));
  return sc.call('sweepTeamProposals', args, { coins: STORAGE_FEE });
}

export { jsonClient };

