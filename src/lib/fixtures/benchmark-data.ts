import { ChatSession, ChatMessage, EpisodicMemory } from '../memory/types';

export interface SeedData {
  sessions: ChatSession[];
  messages: ChatMessage[];
  memories: EpisodicMemory[];
}

export function generateBenchmarkSeedData(referenceDate: Date = new Date()): SeedData {
  // Benchmark Scenario 1: "On Monday we shortlisted 5 CRM tools for a 20-person sales team..."
  // Relative to Nov 15 (Saturday), Monday is Nov 10.
  const mondayDate = new Date(referenceDate);
  mondayDate.setDate(referenceDate.getDate() - ((referenceDate.getDay() + 6) % 7)); // Recent Monday
  mondayDate.setHours(14, 25, 0, 0);

  // Benchmark Scenario 2: "What did I ask you on 3 November? Is your answer still correct today?"
  const nov3Date = new Date(referenceDate.getFullYear(), 10, 3, 11, 15, 0, 0); // Month is 0-indexed, 10 = Nov

  // Benchmark Scenario 3: "Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?"
  const lastTuesdayDate = new Date(referenceDate);
  const currentDay = referenceDate.getDay();
  // Tuesday is day 2. Calculate previous Tuesday (prior calendar week)
  const daysBack = ((currentDay + 7 - 2) % 7) + 7;
  lastTuesdayDate.setDate(referenceDate.getDate() - (daysBack === 7 ? 7 : daysBack));
  lastTuesdayDate.setHours(16, 40, 0, 0);

  const sessionIdCrm = 'session-crm-shortlist-01';
  const sessionIdNov3 = 'session-nov3-eval-02';
  const sessionIdPostgres = 'session-postgres-hosting-03';

  const sessions: ChatSession[] = [
    {
      id: sessionIdCrm,
      title: 'CRM Shortlist for 20-Person Sales Team',
      createdAt: mondayDate.toISOString(),
      updatedAt: mondayDate.toISOString(),
      messageCount: 2,
      preview: 'Shortlisted HubSpot, Pipedrive, Close, Zoho CRM, and Salesforce...',
      simulatedDate: mondayDate.toISOString().split('T')[0],
    },
    {
      id: sessionIdNov3,
      title: 'LLM Capabilities & Computer Use API',
      createdAt: nov3Date.toISOString(),
      updatedAt: nov3Date.toISOString(),
      messageCount: 2,
      preview: 'Anthropic Claude 3.5 Sonnet computer use public beta...',
      simulatedDate: '2026-11-03',
    },
    {
      id: sessionIdPostgres,
      title: 'Managed Postgres Hosting & Pricing Evaluation',
      createdAt: lastTuesdayDate.toISOString(),
      updatedAt: lastTuesdayDate.toISOString(),
      messageCount: 2,
      preview: 'Comparing Neon Serverless, Supabase, Crunchy Bridge, and Aurora...',
      simulatedDate: lastTuesdayDate.toISOString().split('T')[0],
    },
  ];

  const messages: ChatMessage[] = [
    // Scenario 1: Monday CRM
    {
      id: 'msg-crm-1',
      sessionId: sessionIdCrm,
      role: 'user',
      content: 'We need to shortlist 5 CRM tools for our 20-person sales team. Key criteria: lead routing, pipeline visibility, and transparent pricing. What are your recommendations and per-seat costs?',
      createdAt: mondayDate.toISOString(),
      temporalAnchor: 'Monday',
    },
    {
      id: 'msg-crm-2',
      sessionId: sessionIdCrm,
      role: 'assistant',
      content: `Here is our shortlisted evaluation of the top 5 CRM platforms for a 20-person sales team:

1. **HubSpot Sales Hub (Professional)**
   - Pricing: \$90 per seat/month (annual commitment) + \$1,500 one-time onboarding fee. For 20 users, that is \$1,800/month (\$21,600/year).
   - Strengths: Best-in-class inbound integration, robust pipeline reporting, automated email sequences.

2. **Pipedrive (Professional Plan)**
   - Pricing: \$49 per user/month billed annually (\$980/month for 20 seats).
   - Strengths: Highly intuitive Kanban pipeline, quick sales rep adoption, active deal routing.

3. **Close CRM (Growth Plan)**
   - Pricing: \$109 per user/month (\$2,180/month for 20 seats).
   - Strengths: Built-in multi-channel calling, SMS, predictive dialers; engineered specifically for inside sales teams.

4. **Zoho CRM (Enterprise)**
   - Pricing: \$40 per user/month (\$800/month for 20 seats).
   - Strengths: Unbeatable feature-to-price ratio, Zia AI forecasting, deep automation workflows.

5. **Salesforce Sales Cloud (Enterprise)**
   - Pricing: \$165 per user/month (\$3,300/month for 20 seats).
   - Strengths: Industry standard for enterprise customizability, complex approval hierarchies, and limitless third-party integrations.`,
      createdAt: new Date(mondayDate.getTime() + 1000 * 25).toISOString(),
    },

    // Scenario 2: Nov 3 Question
    {
      id: 'msg-nov3-1',
      sessionId: sessionIdNov3,
      role: 'user',
      content: 'What is the latest flagship model from Anthropic, and does Claude 3.5 Sonnet support computer use natively via API?',
      createdAt: nov3Date.toISOString(),
      temporalAnchor: 'November 3, 2026',
    },
    {
      id: 'msg-nov3-2',
      sessionId: sessionIdNov3,
      role: 'assistant',
      content: `As of November 3, 2026:

1. **Anthropic Flagship**: The upgraded **Claude 3.5 Sonnet** (released late October 2024 / refreshed November 2026) is Anthropic's premier frontier model for code and autonomous reasoning, alongside Claude 3.5 Haiku.
2. **Computer Use Native API**: **Yes**, Claude 3.5 Sonnet natively supports the 'computer use' capability via the Anthropic Messages API in public beta. It can take screenshots, move the cursor, click buttons, and type text inside virtual machine environments through defined tool schemas.`,
      createdAt: new Date(nov3Date.getTime() + 1000 * 18).toISOString(),
    },

    // Scenario 3: Last Tuesday Postgres Hosting
    {
      id: 'msg-pg-1',
      sessionId: sessionIdPostgres,
      role: 'user',
      content: 'Can you compare managed Postgres hosting options with modern features like branching and autoscaling? What is the current pricing for small-to-medium teams?',
      createdAt: lastTuesdayDate.toISOString(),
      temporalAnchor: 'Last Tuesday',
    },
    {
      id: 'msg-pg-2',
      sessionId: sessionIdPostgres,
      role: 'assistant',
      content: `Here is the comparison of modern managed Postgres platforms with database branching:

1. **Neon Serverless Postgres**
   - Pricing: Free tier (0.5 GB storage). **Launch plan** at \$19/month includes 10 GB storage and 300 compute hours. **Scale plan** at \$69/month includes 50 GB storage and 750 compute hours.
   - Highlights: Instant copy-on-write branching for dev/staging, scales compute down to zero.

2. **Supabase (Managed Postgres + BaaS)**
   - Pricing: Free tier (500 MB). **Pro Plan** starts at \$25/month with 8 GB database storage, 100k monthly active users, and branching preview add-on (\$0.32/branch/day).
   - Highlights: Integrated Auth, Realtime engine, Storage, and Vector extensions.

3. **Crunchy Bridge**
   - Pricing: Standard-4 instance starts at \$100/month (4 GB RAM, 2 vCPU).
   - Highlights: Enterprise-grade vanilla Postgres, dedicated instances, high availability failover.

4. **AWS Aurora Serverless v2 (PostgreSQL)**
   - Pricing: Charged by Aurora Capacity Units (ACUs) at approximately \$0.12 per ACU-hour + standard Aurora I/O and storage fees.`,
      createdAt: new Date(lastTuesdayDate.getTime() + 1000 * 22).toISOString(),
    },
  ];

  const memories: EpisodicMemory[] = [
    {
      id: 'mem-1',
      sessionId: sessionIdCrm,
      date: mondayDate.toISOString().split('T')[0],
      topic: 'CRM Shortlist for 20-Person Sales Team',
      entities: ['HubSpot', 'Pipedrive', 'Close CRM', 'Zoho CRM', 'Salesforce'],
      summary: 'Shortlisted 5 CRMs (HubSpot $90/mo, Pipedrive $49/mo, Close $109/mo, Zoho $40/mo, Salesforce $165/mo) for 20 reps.',
      keyClaims: [
        'HubSpot Sales Hub Pro costs $90/seat/month + $1500 onboarding',
        'Pipedrive Pro costs $49/seat/month',
        'Close CRM Growth costs $109/seat/month',
        'Zoho CRM Enterprise costs $40/seat/month',
        'Salesforce Sales Cloud Enterprise costs $165/seat/month',
      ],
      rawMessageSnippet: 'HubSpot, Pipedrive, Close, Zoho, Salesforce shortlisted for 20-person sales team.',
    },
    {
      id: 'mem-2',
      sessionId: sessionIdNov3,
      date: '2026-11-03',
      topic: 'Anthropic Claude 3.5 Sonnet Computer Use API',
      entities: ['Anthropic', 'Claude 3.5 Sonnet', 'Computer Use API'],
      summary: 'Explained that Claude 3.5 Sonnet is Anthropic flagship model and confirmed native Computer Use API in beta.',
      keyClaims: [
        'Claude 3.5 Sonnet is Anthropic flagship coding and reasoning model',
        'Computer Use API is available in public beta via Messages API',
      ],
      rawMessageSnippet: 'Asked about Anthropic flagship model and Claude 3.5 Sonnet computer use API.',
    },
    {
      id: 'mem-3',
      sessionId: sessionIdPostgres,
      date: lastTuesdayDate.toISOString().split('T')[0],
      topic: 'Managed Postgres Hosting and Branching Pricing',
      entities: ['Neon', 'Supabase', 'Crunchy Bridge', 'AWS Aurora Serverless v2'],
      summary: 'Compared Neon ($19 Launch, $69 Scale), Supabase ($25 Pro), Crunchy Bridge ($100), and Aurora ($0.12/ACU-hr).',
      keyClaims: [
        'Neon Launch plan is $19/mo, Scale plan is $69/mo with branching',
        'Supabase Pro is $25/mo with branching preview',
        'Crunchy Bridge Standard-4 is $100/mo',
        'Aurora Serverless v2 is ~$0.12 per ACU-hr',
      ],
      rawMessageSnippet: 'Postgres hosting options: Neon, Supabase, Crunchy Bridge, AWS Aurora.',
    },
  ];

  return { sessions, messages, memories };
}
