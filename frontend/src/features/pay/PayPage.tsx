import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  fetchTeam,
  payTeamMutation,
  type PayTeamInput,
} from '../../lib/massa';
import { queryKeys } from '../../lib/queryKeys';
import {
  basisPointsToPercent,
  formatMas,
  planckToMas,
  shortAddress,
} from '../../lib/parsers';
import { useWalletStore } from '../../hooks/useWalletStore';

export default function PayPage() {
  const { teamId = '1' } = useParams();
  const queryClient = useQueryClient();
  const [reference, setReference] = useState('Milestone payment');
  const [memo, setMemo] = useState('');
  const [amount, setAmount] = useState('10');
  const { contract, address } = useWalletStore();

  const { data: team, isLoading, isError } = useQuery({
    queryKey: queryKeys.team(teamId),
    queryFn: () => fetchTeam(teamId),
    enabled: !!teamId,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!contract) throw new Error('Connect wallet first.');
      const payload: PayTeamInput = {
        teamId,
        reference,
        memo,
        amount,
      };
      return payTeamMutation(contract, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.payments(teamId),
      });
    },
  });

  const totalSplit = useMemo(
    () =>
      team?.members.reduce((acc, member) => acc + member.percentage, 0),
    [team],
  );

  if (isLoading) {
    return (
      <div className="text-white/60">Loading team data on Massa…</div>
    );
  }

  if (isError || !team) {
    return (
      <div className="text-red-300">
        Unable to load team. Verify the link and try again.
      </div>
    );
  }

  return (
    <motion.section
      className="grid gap-10 lg:grid-cols-2"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass rounded-3xl p-8 shadow-glass">
        <div className="flex items-center gap-4">
          <img
            src={team.avatar || 'https://i.imgur.com/kF9C0Ky.png'}
            className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
            alt={`${team.name} avatar`}
          />
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/60">
              Paying
            </div>
            <h2 className="font-display text-3xl text-white">
              {team.name}
            </h2>
          </div>
        </div>
        <p className="mt-4 text-white/70">{team.description}</p>
        <div className="mt-6 space-y-3 text-sm text-white/60">
          <div>
            Team owner{' '}
            <span className="font-mono text-white">
              {shortAddress(team.owner)}
            </span>
          </div>
          <div>Split integrity: {basisPointsToPercent(totalSplit ?? 0)}%</div>
        </div>
        <div className="mt-8 space-y-4">
          {team.members.map((member) => (
            <div
              key={member.wallet}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex justify-between text-sm text-white/70">
                <span className="font-semibold text-white">
                  {member.role}
                </span>
                <span className="font-display text-xl text-aurora">
                  {basisPointsToPercent(member.percentage).toFixed(2)}%
                </span>
              </div>
              <div className="text-xs text-white/50">
                {shortAddress(member.wallet)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl p-8 shadow-glass">
        <h3 className="text-xl font-semibold text-white">
          Pay via Massa
        </h3>
        <p className="text-sm text-white/60">
          Funds are split on-chain instantly. Bring testnet MASSA and a
          burner secret key.
        </p>
        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutateAsync();
          }}
        >
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Amount (MASSA)
            <input
              type="number"
              min="0"
              step="0.1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-aurora focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Reference
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-aurora focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-white/70">
            Memo (optional)
            <textarea
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              rows={3}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-aurora focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={!contract || mutation.isPending}
            className="w-full rounded-2xl bg-gradient-to-r from-aurora to-sunset px-6 py-3 font-semibold text-night shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mutation.isPending ? 'Sending…' : 'Pay now'}
          </button>
          <p className="text-xs text-white/50">
            Connected wallet:{' '}
            {address ? shortAddress(address) : 'Not connected'}
          </p>
          {mutation.isError && (
            <p className="text-sm text-red-400">
              {(mutation.error as Error).message}
            </p>
          )}
          {mutation.isSuccess && (
            <p className="text-sm text-aurora">
              Payment submitted to Massa! Track it via Massa explorer.
            </p>
          )}
        </form>
        <div className="mt-8 text-sm text-white/70">
          <div className="text-xs uppercase tracking-[0.4em] text-white/40">
            Lifetime payouts
          </div>
          <div className="font-display text-3xl text-white">
            {formatMas(team.totalReceived)} MASSA
          </div>
          <div className="text-xs text-white/50">
            Avg per member:{' '}
            {(planckToMas(team.totalReceived) / team.members.length).toFixed(
              2,
            )}{' '}
            MASSA
          </div>
        </div>
      </div>
    </motion.section>
  );
}

