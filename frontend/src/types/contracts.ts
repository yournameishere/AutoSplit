export type HexString = string;

export interface TeamMember {
  wallet: HexString;
  role: string;
  percentage: number;
  totalEarned: string;
  lastPaidAt: string;
}

export interface Team {
  id: string;
  owner: HexString;
  name: string;
  description: string;
  currency: string;
  avatar: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  payLinkSlug: string;
  totalReceived: string;
  members: TeamMember[];
}

export interface Payment {
  id: string;
  teamId: string;
  payer: HexString;
  amount: string;
  timestamp: string;
  reference: string;
  memo: string;
}

export interface ProposalAllocation {
  member: HexString;
  role: string;
  percentage: number;
}

export interface ProposalVote {
  voter: HexString;
  support: boolean;
  weight: number;
}

export interface Proposal {
  id: string;
  teamId: string;
  teamName: string;
  creator: HexString;
  reason: string;
  endTime: string;
  executed: boolean;
  yesVotes: number;
  noVotes: number;
  createdAt: string;
  allocations: ProposalAllocation[];
  votes: ProposalVote[];
}


