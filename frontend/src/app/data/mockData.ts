export interface Competition {
  id: string;
  title: string;
  description: string;
  category: string;
  prizePool: number;
  startDate: string;
  endDate: string;
  daysLeft: number;
  participants: number;
  usersVerified: number;
  verifyRate: number;
  status: 'active' | 'ended' | 'upcoming';
  winners: number;
  scoringRules: { event: string; points: number }[];
  leaderboard: { rank: number; name: string; pts: number; delta: number; wallet: string }[];
  progress: number;
}

export interface Participant {
  rank: number;
  name: string;
  wallet: string;
  pts: number;
  wins: number;
  delta: number;
  competitions: number;
  earned: number;
}

export const competitions: Competition[] = [
  {
    id: 'comp-1',
    title: 'Acquire 20 Active Users for SaaS Tool',
    description: 'Drive high-quality user acquisition for our B2B project management SaaS. Focus on signups, onboarding completion, and core feature usage within the first 7 days.',
    category: 'SaaS · User Acquisition',
    prizePool: 500,
    startDate: '2026-05-26',
    endDate: '2026-06-05',
    daysLeft: 3,
    participants: 34,
    usersVerified: 847,
    verifyRate: 94.2,
    status: 'active',
    winners: 3,
    progress: 68,
    scoringRules: [
      { event: 'signup', points: 1 },
      { event: 'onboarding_completed', points: 5 },
      { event: 'core_action_completed', points: 10 },
      { event: 'returned_after_24h', points: 20 },
      { event: 'paid_conversion', points: 50 },
    ],
    leaderboard: [
      { rank: 1, name: 'Alice K.', pts: 248, delta: 18, wallet: '0xAB12...3F4E' },
      { rank: 2, name: 'Bob M.', pts: 213, delta: -4, wallet: '0xCD34...7A2B' },
      { rank: 3, name: 'Carlos R.', pts: 176, delta: 11, wallet: '0xEF56...9C3D' },
      { rank: 4, name: 'Diana W.', pts: 141, delta: 6, wallet: '0x1234...AB5C' },
      { rank: 5, name: 'Sam T.', pts: 98, delta: -2, wallet: '0x5678...DE6F' },
    ],
  },
  {
    id: 'comp-2',
    title: 'Drive Retention for Fintech App',
    description: 'Maximize 7-day and 30-day retention metrics for a personal finance app. Target users who complete KYC, link a bank account, and complete at least one transaction.',
    category: 'Fintech · Retention',
    prizePool: 1000,
    startDate: '2026-05-28',
    endDate: '2026-06-09',
    daysLeft: 7,
    participants: 78,
    usersVerified: 2140,
    verifyRate: 91.7,
    status: 'active',
    winners: 5,
    progress: 42,
    scoringRules: [
      { event: 'signup', points: 1 },
      { event: 'kyc_completed', points: 8 },
      { event: 'bank_linked', points: 12 },
      { event: 'first_transaction', points: 25 },
      { event: 'day7_retention', points: 40 },
      { event: 'day30_retention', points: 100 },
    ],
    leaderboard: [
      { rank: 1, name: 'Felix O.', pts: 412, delta: 32, wallet: '0xGH78...1B2C' },
      { rank: 2, name: 'Diana W.', pts: 362, delta: 8, wallet: '0x1234...AB5C' },
      { rank: 3, name: 'Sam T.', pts: 298, delta: -6, wallet: '0x5678...DE6F' },
      { rank: 4, name: 'Mei L.', pts: 244, delta: 21, wallet: '0x9012...GH7I' },
      { rank: 5, name: 'Alice K.', pts: 198, delta: 5, wallet: '0xAB12...3F4E' },
    ],
  },
  {
    id: 'comp-3',
    title: 'B2B Lead Activation Sprint',
    description: 'Generate qualified B2B leads for a CRM platform. Leads must complete a demo request, attend a 15-min call, and activate a trial account.',
    category: 'B2B · Lead Gen',
    prizePool: 750,
    startDate: '2026-05-29',
    endDate: '2026-06-07',
    daysLeft: 5,
    participants: 22,
    usersVerified: 312,
    verifyRate: 88.5,
    status: 'active',
    winners: 3,
    progress: 55,
    scoringRules: [
      { event: 'demo_request', points: 5 },
      { event: 'call_attended', points: 20 },
      { event: 'trial_activated', points: 50 },
      { event: 'trial_day7_active', points: 80 },
    ],
    leaderboard: [
      { rank: 1, name: 'Carlos R.', pts: 320, delta: 15, wallet: '0xEF56...9C3D' },
      { rank: 2, name: 'Mei L.', pts: 280, delta: 9, wallet: '0x9012...GH7I' },
      { rank: 3, name: 'Bob M.', pts: 215, delta: -3, wallet: '0xCD34...7A2B' },
    ],
  },
  {
    id: 'comp-4',
    title: 'Mobile App Install & Activate',
    description: 'Drive installs and first-session activation for a consumer productivity app. Target iOS and Android users who complete the onboarding flow and use a core feature within 48h.',
    category: 'Mobile · Activation',
    prizePool: 2000,
    startDate: '2026-06-01',
    endDate: '2026-06-15',
    daysLeft: 13,
    participants: 145,
    usersVerified: 4820,
    verifyRate: 96.1,
    status: 'active',
    winners: 5,
    progress: 20,
    scoringRules: [
      { event: 'app_install', points: 2 },
      { event: 'onboarding_completed', points: 8 },
      { event: 'core_feature_used', points: 15 },
      { event: 'day2_return', points: 30 },
      { event: 'push_enabled', points: 5 },
    ],
    leaderboard: [
      { rank: 1, name: 'Felix O.', pts: 680, delta: 45, wallet: '0xGH78...1B2C' },
      { rank: 2, name: 'Alice K.', pts: 612, delta: 22, wallet: '0xAB12...3F4E' },
      { rank: 3, name: 'Diana W.', pts: 544, delta: 18, wallet: '0x1234...AB5C' },
      { rank: 4, name: 'Sam T.', pts: 499, delta: 7, wallet: '0x5678...DE6F' },
      { rank: 5, name: 'Carlos R.', pts: 441, delta: -5, wallet: '0xEF56...9C3D' },
    ],
  },
  {
    id: 'comp-5',
    title: 'E-commerce Conversion Boost',
    description: 'Drive first purchases and repeat buying behavior for a DTC e-commerce brand. Score based on purchase events and return purchase within 14 days.',
    category: 'E-commerce · Conversion',
    prizePool: 1500,
    startDate: '2026-05-20',
    endDate: '2026-06-01',
    daysLeft: 0,
    participants: 89,
    usersVerified: 3102,
    verifyRate: 93.4,
    status: 'ended',
    winners: 3,
    progress: 100,
    scoringRules: [
      { event: 'signup', points: 1 },
      { event: 'cart_created', points: 3 },
      { event: 'first_purchase', points: 40 },
      { event: 'repeat_purchase_14d', points: 90 },
    ],
    leaderboard: [
      { rank: 1, name: 'Mei L.', pts: 920, delta: 0, wallet: '0x9012...GH7I' },
      { rank: 2, name: 'Alice K.', pts: 840, delta: 0, wallet: '0xAB12...3F4E' },
      { rank: 3, name: 'Bob M.', pts: 760, delta: 0, wallet: '0xCD34...7A2B' },
    ],
  },
  {
    id: 'comp-6',
    title: 'Web3 Wallet Onboarding',
    description: 'Onboard users to a new DeFi protocol. Target wallet connections, first swap, and liquidity provision events verified on-chain.',
    category: 'Web3 · Onboarding',
    prizePool: 3000,
    startDate: '2026-06-10',
    endDate: '2026-06-24',
    daysLeft: 22,
    participants: 0,
    usersVerified: 0,
    verifyRate: 0,
    status: 'upcoming',
    winners: 5,
    progress: 0,
    scoringRules: [
      { event: 'wallet_connected', points: 5 },
      { event: 'first_swap', points: 30 },
      { event: 'liquidity_added', points: 80 },
      { event: 'governance_vote', points: 20 },
    ],
    leaderboard: [],
  },
];

export const globalLeaderboard: Participant[] = [
  { rank: 1, name: 'Alice K.', wallet: '0xAB12...3F4E', pts: 1240, wins: 7, delta: 18, competitions: 12, earned: 4200 },
  { rank: 2, name: 'Bob M.', wallet: '0xCD34...7A2B', pts: 1180, wins: 5, delta: -4, competitions: 10, earned: 3100 },
  { rank: 3, name: 'Felix O.', wallet: '0xGH78...1B2C', pts: 1120, wins: 4, delta: 32, competitions: 9, earned: 2800 },
  { rank: 4, name: 'Diana W.', wallet: '0x1234...AB5C', pts: 980, wins: 3, delta: 8, competitions: 8, earned: 2200 },
  { rank: 5, name: 'Carlos R.', wallet: '0xEF56...9C3D', pts: 870, wins: 2, delta: -12, competitions: 7, earned: 1800 },
  { rank: 6, name: 'Mei L.', wallet: '0x9012...GH7I', pts: 810, wins: 2, delta: 21, competitions: 6, earned: 1500 },
  { rank: 7, name: 'Sam T.', wallet: '0x5678...DE6F', pts: 740, wins: 1, delta: 6, competitions: 5, earned: 950 },
  { rank: 8, name: 'Priya N.', wallet: '0x3456...IJ8K', pts: 680, wins: 1, delta: -8, competitions: 4, earned: 800 },
  { rank: 9, name: 'James W.', wallet: '0x7890...KL9M', pts: 590, wins: 0, delta: 14, competitions: 4, earned: 620 },
  { rank: 10, name: 'Yuki S.', wallet: '0xBC12...MN0P', pts: 520, wins: 0, delta: 3, competitions: 3, earned: 400 },
];

export const verificationFeed = [
  { time: '09:41:02', tag: 'VERIFIED', tagClass: 'green', msg: 'onboarding_completed · user_2841 · +5pts' },
  { time: '09:41:04', tag: 'VERIFIED', tagClass: 'green', msg: 'feature_usage_detected · user_2840 · +10pts' },
  { time: '09:41:07', tag: 'UPDATED', tagClass: 'blue', msg: 'leaderboard_position #3→#2 · felix_o' },
  { time: '09:41:09', tag: 'PROCESS', tagClass: 'amber', msg: 'activation_score computed · +24pts' },
  { time: '09:41:12', tag: 'VERIFIED', tagClass: 'green', msg: 'day7_retention confirmed · user_2839 · +40pts' },
  { time: '09:41:15', tag: 'UPDATED', tagClass: 'blue', msg: 'escrow_balance checked · 500 USDC' },
  { time: '09:41:18', tag: 'VERIFIED', tagClass: 'green', msg: 'payment_method_added · user_2838 · +12pts' },
  { time: '09:41:21', tag: 'UPDATED', tagClass: 'blue', msg: 'ranking_recalculated · 78 participants' },
];
