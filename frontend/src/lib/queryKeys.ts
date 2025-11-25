export const queryKeys = {
  team: (teamId: string | number) => ['team', String(teamId)],
  ownerTeams: (owner: string) => ['owner-teams', owner],
  memberTeams: (wallet: string) => ['member-teams', wallet],
  payments: (teamId: string | number) => ['payments', String(teamId)],
  proposals: (teamId: string | number) => ['proposals', String(teamId)],
  config: ['autosplit-config'],
} as const;


