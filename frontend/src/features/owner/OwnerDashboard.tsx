import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addMemberMutation,
  createProposalMutation,
  createTeamMutation,
  fetchOwnerTeams,
  fetchPayments,
  fetchProposals,
  toggleTeamStatus,
  type AddMemberInput,
  type CreateTeamInput,
  type ProposalInput,
} from '../../lib/massa';
import { useWalletStore } from '../../hooks/useWalletStore';
import { queryKeys } from '../../lib/queryKeys';
import {
  basisPointsToPercent,
  formatMas,
  formatTimestamp,
  planckToMas,
  shortAddress,
} from '../../lib/parsers';
import type { Team } from '../../types/contracts';

export default function OwnerDashboard() {
  const { address, contract, status } = useWalletStore();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    null,
  );
  const [teamForm, setTeamForm] = useState<CreateTeamInput>({
    name: '',
    description: '',
    avatar: '',
    currency: 'MASSA',
    tags: [],
    slug: '',
  });
  const [memberForm, setMemberForm] = useState<AddMemberInput>({
    teamId: '',
    wallet: '',
    role: '',
    percentage: 0,
  });
  const [proposalForm, setProposalForm] = useState<ProposalInput>({
    teamId: '',
    reason: '',
    allocations: [],
  });

  const queryClient = useQueryClient();

  const teamsQuery = useQuery({
    queryKey: queryKeys.ownerTeams(address ?? 'unknown'),
    queryFn: () => fetchOwnerTeams(address ?? ''),
    enabled: !!address,
  });

  const teams = teamsQuery.data ?? [];
  const currentTeamId =
    selectedTeamId ?? teams[0]?.id ?? memberForm.teamId ?? null;

  const paymentsQuery = useQuery({
    queryKey: queryKeys.payments(currentTeamId ?? '0'),
    queryFn: () => fetchPayments(currentTeamId ?? '0', 10),
    enabled: !!currentTeamId,
  });

  const proposalsQuery = useQuery({
    queryKey: queryKeys.proposals(currentTeamId ?? '0'),
    queryFn: () => fetchProposals(currentTeamId ?? '0'),
    enabled: !!currentTeamId,
  });

  const createTeam = useMutation({
    mutationFn: async () => {
      if (!contract) throw new Error('Connect wallet');
      return createTeamMutation(contract, {
        ...teamForm,
        tags: teamForm.tags,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.ownerTeams(address ?? 'unknown'),
      });
      setTeamForm({
        name: '',
        description: '',
        avatar: '',
        currency: 'MASSA',
        tags: [],
        slug: '',
      });
    },
  });

  const addMember = useMutation({
    mutationFn: async () => {
      if (!contract) throw new Error('Connect wallet');
      if (!memberForm.teamId && !currentTeamId) {
        throw new Error('Select a team first');
      }
      return addMemberMutation(contract, {
        ...memberForm,
        teamId: memberForm.teamId || currentTeamId!,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.ownerTeams(address ?? 'unknown'),
      });
      setMemberForm({
        teamId: '',
        wallet: '',
        role: '',
        percentage: 0,
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (team: Team) => {
      if (!contract) throw new Error('Connect wallet');
      return toggleTeamStatus(contract, team.id, !team.isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.ownerTeams(address ?? 'unknown'),
      });
    },
  });

  const proposalMutation = useMutation({
    mutationFn: async () => {
      if (!contract) throw new Error('Connect wallet');
      if (!proposalForm.teamId && !currentTeamId) {
        throw new Error('Select a team');
      }
      return createProposalMutation(contract, {
        ...proposalForm,
        teamId: proposalForm.teamId || currentTeamId!,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.proposals(currentTeamId ?? '0'),
      });
      setProposalForm({
        teamId: '',
        reason: '',
        allocations: [],
      });
    },
  });

  const totalVolume = teams.reduce(
    (acc, team) => acc + planckToMas(team.totalReceived),
    0,
  );

  if (!address) {
    return (
      <div className="text-white/70">
        Connect your Massa wallet to access the owner dashboard.
      </div>
    );
  }

  return (
    <section className="space-y-10">
      <motion.div
        className="grid gap-4 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <StatCard
          title="Teams live"
          value={teams.length.toString()}
          hint="Active smart contracts"
        />
        <StatCard
          title="Total split volume"
          value={`${totalVolume.toFixed(2)} MASSA`}
          hint="Lifetime"
        />
        <StatCard
          title="Wallet"
          value={shortAddress(address)}
          hint={`Status: ${status}`}
        />
      </motion.div>

      <motion.div
        className="grid gap-8 lg:grid-cols-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="glass rounded-3xl p-6">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Your teams
            </h3>
            {teamsQuery.isFetching && (
              <span className="text-xs text-white/50">refreshing…</span>
            )}
          </header>
          <div className="space-y-4">
            {teams.map((team) => (
              <button
                key={team.id}
                className={`w-full rounded-2xl border border-white/10 px-4 py-3 text-left transition ${
                  currentTeamId === team.id
                    ? 'bg-white/10 text-white'
                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                }`}
                onClick={() => setSelectedTeamId(team.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase text-white/50">
                      {team.currency}
                    </p>
                    <p className="text-xl font-semibold">{team.name}</p>
                  </div>
                  <div className="text-right text-sm text-white/60">
                    <div>{formatMas(team.totalReceived)} MASSA</div>
                    <div>
                      {team.isActive ? 'Active' : 'Paused'} ·{' '}
                      {team.members.length} members
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {!teams.length && (
              <p className="text-sm text-white/50">
                No teams yet. Create one below.
              </p>
            )}
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white">
            Create a new team
          </h3>
          <form
            className="mt-4 space-y-4 text-sm text-white/70"
            onSubmit={(event) => {
              event.preventDefault();
              createTeam.mutate();
            }}
          >
            <InputField
              label="Name"
              value={teamForm.name}
              onChange={(value) =>
                setTeamForm((prev) => ({ ...prev, name: value }))
              }
            />
            <InputField
              label="Description"
              value={teamForm.description}
              onChange={(value) =>
                setTeamForm((prev) => ({
                  ...prev,
                  description: value,
                }))
              }
            />
            <InputField
              label="Avatar URL"
              value={teamForm.avatar}
              onChange={(value) =>
                setTeamForm((prev) => ({ ...prev, avatar: value }))
              }
            />
            <InputField
              label="Slug"
              value={teamForm.slug}
              onChange={(value) =>
                setTeamForm((prev) => ({ ...prev, slug: value }))
              }
            />
            <InputField
              label="Tags (comma separated)"
              value={teamForm.tags.join(', ')}
              onChange={(value) =>
                setTeamForm((prev) => ({
                  ...prev,
                  tags: value
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                }))
              }
            />
            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-aurora to-sunset px-4 py-3 font-semibold text-night disabled:opacity-40"
              disabled={createTeam.isPending}
            >
              {createTeam.isPending ? 'Deploying…' : 'Deploy team'}
            </button>
            {createTeam.isError && (
              <p className="text-red-400">
                {(createTeam.error as Error).message}
              </p>
            )}
          </form>
        </div>
      </motion.div>

      {currentTeamId && (
        <motion.div
          className="grid gap-8 lg:grid-cols-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="glass rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white">
              Add member
            </h3>
            <form
              className="mt-4 space-y-4 text-sm text-white/70"
              onSubmit={(event) => {
                event.preventDefault();
                addMember.mutate();
              }}
            >
              <InputField
                label="Wallet"
                value={memberForm.wallet}
                onChange={(value) =>
                  setMemberForm((prev) => ({ ...prev, wallet: value }))
                }
              />
              <InputField
                label="Role"
                value={memberForm.role}
                onChange={(value) =>
                  setMemberForm((prev) => ({ ...prev, role: value }))
                }
              />
              <InputField
                label="Percentage (basis points)"
                type="number"
                value={String(memberForm.percentage)}
                onChange={(value) =>
                  setMemberForm((prev) => ({
                    ...prev,
                    percentage: Number(value),
                  }))
                }
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-white/90 px-4 py-3 font-semibold text-night disabled:opacity-40"
                disabled={addMember.isPending}
              >
                {addMember.isPending ? 'Saving…' : 'Add member'}
              </button>
            </form>
          </div>
          <div className="glass rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white">
              Split proposal
            </h3>
            <form
              className="mt-4 space-y-4 text-sm text-white/70"
              onSubmit={(event) => {
                event.preventDefault();
                proposalMutation.mutate();
              }}
            >
              <InputField
                label="Reason"
                value={proposalForm.reason}
                onChange={(value) =>
                  setProposalForm((prev) => ({ ...prev, reason: value }))
                }
              />
              <textarea
                rows={4}
                placeholder="member:role:percentage per line"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-aurora focus:outline-none"
                onChange={(event) => {
                  const lines = event.target.value.split('\n').filter(Boolean);
                  setProposalForm((prev) => ({
                    ...prev,
                    allocations: lines.map((line) => {
                      const [wallet, role, pct] = line
                        .split(':')
                        .map((item) => item.trim());
                      return {
                        wallet,
                        role,
                        percentage: Number(pct ?? 0),
                      };
                    }),
                  }));
                }}
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-sunset to-aurora px-4 py-3 font-semibold text-night disabled:opacity-40"
                disabled={proposalMutation.isPending}
              >
                {proposalMutation.isPending
                  ? 'Submitting…'
                  : 'Create proposal'}
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {currentTeamId && (
        <motion.div
          className="grid gap-8 lg:grid-cols-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="glass rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Latest payments
              </h3>
            <button
              className="text-xs text-white/60"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: queryKeys.payments(currentTeamId),
                })
              }
            >
                Refresh
              </button>
            </div>
            <div className="space-y-3">
              {(paymentsQuery.data ?? []).map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
                >
                  <div className="flex items-center justify-between text-white">
                    <span className="font-semibold">
                      {formatMas(payment.amount)} MASSA
                    </span>
                    <span>{formatTimestamp(payment.timestamp)}</span>
                  </div>
                  <div>From {shortAddress(payment.payer)}</div>
                  <div className="text-white/60">
                    Ref: {payment.reference}
                  </div>
                </div>
              ))}
              {!paymentsQuery.data?.length && (
                <p className="text-white/50 text-sm">
                  No payments yet. Share your pay link!
                </p>
              )}
            </div>
          </div>
          <div className="glass rounded-3xl p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Proposals
            </h3>
            <div className="space-y-3 text-sm text-white/70">
              {(proposalsQuery.data ?? []).map((proposal) => (
                <div
                  key={proposal.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">
                      {proposal.reason}
                    </p>
                    <span className="text-xs uppercase text-white/50">
                      {proposal.executed ? 'Executed' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">
                    Ends {formatTimestamp(proposal.endTime)}
                  </p>
                  <p>
                    Yes weight:{' '}
                    {basisPointsToPercent(proposal.yesVotes).toFixed(1)}%
                  </p>
                  <p>
                    No weight:{' '}
                    {basisPointsToPercent(proposal.noVotes).toFixed(1)}%
                  </p>
                </div>
              ))}
              {!proposalsQuery.data?.length && (
                <p className="text-white/50 text-sm">
                  No proposals yet. Create one to adjust the split.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {currentTeamId && (
        <motion.div
          className="glass rounded-3xl p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-lg font-semibold text-white">
            Actions
          </h3>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/70">
            <button
              className="rounded-2xl border border-white/20 px-4 py-2 hover:border-white/40"
              onClick={() => {
                if (!currentTeamId) return;
                const team = teams.find((t) => t.id === currentTeamId);
                if (!team) return;
                toggleStatusMutation.mutate(team);
              }}
            >
              Toggle status
            </button>
            <button
              className="rounded-2xl border border-white/20 px-4 py-2 hover:border-white/40"
              onClick={() => navigator.clipboard.writeText(`/pay/${currentTeamId}`)}
            >
              Copy pay link
            </button>
          </div>
        </motion.div>
      )}
    </section>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="glass rounded-3xl p-5">
      <p className="text-xs uppercase tracking-[0.4em] text-white/50">
        {title}
      </p>
      <p className="mt-2 font-display text-3xl text-white">{value}</p>
      <p className="text-sm text-white/50">{hint}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.3em] text-white/40">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-aurora focus:outline-none"
      />
    </label>
  );
}

