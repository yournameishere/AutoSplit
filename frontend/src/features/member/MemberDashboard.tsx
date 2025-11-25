import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useWalletStore } from '../../hooks/useWalletStore';
import {
  fetchMemberTeams,
  fetchProposals,
  voteOnProposal,
} from '../../lib/massa';
import { queryKeys } from '../../lib/queryKeys';
import {
  basisPointsToPercent,
  formatMas,
  formatTimestamp,
  shortAddress,
} from '../../lib/parsers';

export default function MemberDashboard() {
  const { address, contract } = useWalletStore();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    null,
  );
  const teamsQuery = useQuery({
    queryKey: queryKeys.memberTeams(address ?? 'unknown'),
    queryFn: () => fetchMemberTeams(address ?? ''),
    enabled: !!address,
  });

  const currentTeamId =
    selectedTeamId ?? teamsQuery.data?.[0]?.id ?? null;

  const proposalsQuery = useQuery({
    queryKey: queryKeys.proposals(currentTeamId ?? '0'),
    queryFn: () => fetchProposals(currentTeamId ?? '0'),
    enabled: !!currentTeamId,
  });

  const voteMutation = useMutation({
    mutationFn: async ({
      proposalId,
      support,
    }: {
      proposalId: string;
      support: boolean;
    }) => {
      if (!contract) throw new Error('Connect wallet');
      return voteOnProposal(contract, proposalId, support);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.proposals(currentTeamId ?? '0'),
      });
    },
  });

  if (!address) {
    return (
      <p className="text-white/70">
        Connect your wallet to view member insights.
      </p>
    );
  }

  const totalEarnings = teamsQuery.data
    ?.flatMap((team) =>
      team.members.filter((member) => member.wallet === address),
    )
    .reduce(
      (acc, member) => acc + Number(member.totalEarned ?? 0),
      0,
    );

  return (
    <section className="space-y-8">
      <motion.div
        className="grid gap-4 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <MemberStat
          title="Total earnings"
          value={`${formatMas(totalEarnings ?? 0)} MASSA`}
          hint="Across all teams"
        />
        <MemberStat
          title="Active teams"
          value={String(teamsQuery.data?.length ?? 0)}
          hint="You are part of"
        />
        <MemberStat
          title="Wallet"
          value={shortAddress(address)}
          hint="on buildnet"
        />
      </motion.div>

      <motion.div
        className="glass rounded-3xl p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h3 className="mb-4 text-lg font-semibold text-white">
          My teams
        </h3>
        <div className="space-y-4">
          {(teamsQuery.data ?? []).map((team) => {
            const myShare = team.members.find(
              (member) => member.wallet === address,
            );
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`w-full rounded-2xl border border-white/10 px-4 py-3 text-left ${
                  currentTeamId === team.id
                    ? 'bg-white/10'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="text-sm uppercase text-white/40">
                      {team.name}
                    </p>
                    <p className="text-lg font-semibold text-aurora">
                      {myShare
                        ? `${basisPointsToPercent(
                            myShare.percentage,
                          ).toFixed(2)}%`
                        : '—'}
                    </p>
                  </div>
                  <div className="text-right text-sm text-white/70">
                    <p>{team.members.length} members</p>
                    <p>{formatMas(team.totalReceived)} MASSA</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {!teamsQuery.data?.length && (
          <p className="mt-4 text-sm text-white/50">
            You are not part of any teams yet.
          </p>
        )}
      </motion.div>

      {currentTeamId && (
        <motion.div
          className="glass rounded-3xl p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Governance proposals
            </h3>
            <button
              className="text-xs text-white/60"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: queryKeys.proposals(currentTeamId),
                })
              }
            >
              Refresh
            </button>
          </div>
          <div className="space-y-4">
            {(proposalsQuery.data ?? []).map((proposal) => (
              <div
                key={proposal.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {proposal.reason}
                    </p>
                    <p className="text-xs text-white/50">
                      Ends {formatTimestamp(proposal.endTime)}
                    </p>
                  </div>
                  <div className="text-right text-xs uppercase text-white/50">
                    {proposal.executed ? 'Executed' : 'Active'}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span>
                    Yes:{' '}
                    {basisPointsToPercent(proposal.yesVotes).toFixed(1)}%
                  </span>
                  <span>
                    No:{' '}
                    {basisPointsToPercent(proposal.noVotes).toFixed(1)}%
                  </span>
                </div>
                {!proposal.executed && (
                  <div className="mt-3 flex gap-3">
                    <button
                      className="flex-1 rounded-2xl border border-white/20 px-3 py-2 text-xs font-semibold text-aurora hover:border-aurora"
                      onClick={() =>
                        voteMutation.mutate({
                          proposalId: proposal.id,
                          support: true,
                        })
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="flex-1 rounded-2xl border border-white/20 px-3 py-2 text-xs font-semibold text-red-300 hover:border-red-300"
                      onClick={() =>
                        voteMutation.mutate({
                          proposalId: proposal.id,
                          support: false,
                        })
                      }
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!proposalsQuery.data?.length && (
              <p className="text-white/50 text-sm">
                No proposals right now. Enjoy the calm!
              </p>
            )}
          </div>
        </motion.div>
      )}
    </section>
  );
}

function MemberStat({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="glass rounded-3xl p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
        {title}
      </p>
      <p className="mt-2 font-display text-2xl text-white">{value}</p>
      <p className="text-sm text-white/60">{hint}</p>
    </div>
  );
}

