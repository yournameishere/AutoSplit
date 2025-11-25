import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, WalletCards } from 'lucide-react';

const heroStats = [
  { label: 'Payments automated', value: '100%' },
  { label: 'Splits per transfer', value: '∞ members' },
  { label: 'Governance ready', value: 'DAO-native' },
];

const flowSteps = [
  'Owner defines teams & percentages once',
  'Clients pay a single link or QR',
  'Smart contract streams MASSA to every member instantly',
  'Members vote on split changes with on-chain proposals',
];

const personas = [
  {
    title: 'Clients',
    copy:
      'No dashboard—just a pay link backed by Massa. Transparent receipts, instant trust.',
  },
  {
    title: 'Team Owners',
    copy:
      'Create teams, add members, and watch analytics update in real-time. Governance-safe.',
  },
  {
    title: 'Contributors',
    copy:
      'Dashboard with earnings, payment history, and proposal voting baked in.',
  },
];

export default function LandingPage() {
  return (
    <section className="space-y-20">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-8">
          <motion.p
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/70"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Shield className="h-4 w-4 text-aurora" />
            Powered by Massa ASC
          </motion.p>
          <motion.h1
            className="font-display text-4xl leading-tight text-white md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Payments in. <span className="text-aurora">Fair splits</span> out.
            Automatically.
          </motion.h1>
          <motion.p
            className="text-lg text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            AutoSplit is the end-to-end Massa dApp for creative collectives,
            agencies, DAOs, and collab squads. Every MASSA payment instantly
            splits into provable, on-chain payouts with governance baked in.
          </motion.p>
          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              to="/dashboard/owner"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-aurora to-sunset px-6 py-3 font-semibold text-night shadow-lg"
            >
              Launch Owner Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pay/1"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3 font-semibold text-white/80"
            >
              Demo pay experience <WalletCards className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.div
            className="grid grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center"
              >
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-xs uppercase text-white/60">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
        <motion.div
          className="glass relative overflow-hidden rounded-3xl p-8 shadow-glass"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="relative space-y-6">
            <div className="text-sm uppercase tracking-[0.4em] text-white/60">
              Flow
            </div>
            <ol className="space-y-5">
              {flowSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-night/30 px-4 py-3"
                >
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/70">
                    {index + 1}
                  </span>
                  <p className="text-white/80">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </motion.div>
      </div>

      <motion.section
        className="glass grid gap-6 rounded-3xl p-8 shadow-glass md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {personas.map((persona) => (
          <div key={persona.title} className="space-y-3">
            <h3 className="font-display text-xl text-white">
              {persona.title}
            </h3>
            <p className="text-white/70">{persona.copy}</p>
          </div>
        ))}
      </motion.section>
    </section>
  );
}


