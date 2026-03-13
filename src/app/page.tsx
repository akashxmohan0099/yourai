import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

const features = [
  {
    icon: Phone,
    title: 'Voice that carries context',
    description:
      'AI answers calls, qualifies leads, books appointments, and logs everything.',
  },
  {
    icon: MessageSquare,
    title: 'One inbox for every channel',
    description:
      'Chat, SMS, email, and follow-ups in one unified feed.',
  },
  {
    icon: CalendarClock,
    title: 'Bookings with guardrails',
    description:
      'Appointments and approvals follow your rules, even after hours.',
  },
  {
    icon: ShieldCheck,
    title: 'Owner control without micromanaging',
    description:
      'Escalations and summaries reach you only when needed.',
  },
]

const stats = [
  { label: 'Channels unified', value: '4' },
  { label: 'Owner workflows', value: '24/7' },
  { label: 'Response rhythm', value: '<30s' },
]

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-10 pt-5 sm:px-6 lg:px-8">
        <nav className="panel flex items-center justify-between rounded-[30px] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.16)]">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">YourAI</p>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-faint)]">
                Business Ops Console
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="btn-ghost">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary">
              Start setup
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>

        <main className="grid flex-1 gap-6 pb-10 pt-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(24rem,0.9fr)] lg:items-stretch">
          <section className="panel flex flex-col justify-between rounded-[38px] px-6 py-8 sm:px-8 sm:py-10">
            <div className="space-y-6">
              <span className="eyebrow-stack">
                Built for busy service businesses
              </span>
              <div className="max-w-3xl space-y-5">
                <h1 className="max-w-3xl text-5xl font-semibold leading-[0.94] text-[var(--ink)] sm:text-6xl lg:text-7xl">
                  An operations room
                  <br />
                  for every customer conversation.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-[var(--ink-soft)] sm:text-lg">
                  YourAI handles calls, bookings, approvals, and follow-ups in one control surface — not a generic chatbot.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/signup" className="btn-primary">
                  Launch your workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="btn-secondary">
                  See the operator view
                </Link>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="panel-muted rounded-[26px] px-5 py-4">
                  <p className="text-3xl font-semibold text-[var(--ink)]">{stat.value}</p>
                  <p className="mt-1 text-sm text-[var(--ink-faint)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <div className="panel rounded-[34px] px-6 py-7 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="kicker">
                    Live cockpit
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--ink)]">
                    Real results, not AI theater
                  </h2>
                </div>
                <span className="chip chip-accent">
                  Real approvals
                </span>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-[28px] border border-[var(--line)] bg-white/50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-faint)]">
                        Incoming voice call
                      </p>
                      <p className="mt-2 text-xl font-semibold text-[var(--ink)]">
                        New booking request from Lara Nguyen
                      </p>
                    </div>
                    <span className="chip chip-teal">
                      02:14
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                    AI gathered the preferred service, offered two time slots, and flagged a price
                    exception for review.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[28px] border border-[var(--line)] bg-white/50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
                        <Mail className="h-5 w-5 text-[var(--teal)]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Morning briefing</p>
                        <p className="text-xs text-[var(--ink-faint)]">Schedule, leads, and exceptions in one summary</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-[var(--line)] bg-white/50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
                        <Phone className="h-5 w-5 text-[var(--accent)]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Escalation control</p>
                        <p className="text-xs text-[var(--ink-faint)]">Approvals reach the owner only when rules require it</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel rounded-[34px] px-6 py-6 sm:px-7">
              <p className="kicker">Built to feel operational</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-4 rounded-[26px] border border-[var(--line)] bg-white/50 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(208,109,79,0.12)]">
                    <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">No fake dashboards</p>
                    <p className="mt-1 text-sm leading-7 text-[var(--ink-soft)]">
                      The product is organized around decisions, throughput, and customer context.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-[26px] border border-[var(--line)] bg-white/50 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(43,114,107,0.12)]">
                    <MessageSquare className="h-5 w-5 text-[var(--teal)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">One design language everywhere</p>
                    <p className="mt-1 text-sm leading-7 text-[var(--ink-soft)]">
                      The same system now carries landing, auth, onboarding, and the dashboard shell.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <section className="grid gap-4 pb-8 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="panel rounded-[30px] px-5 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.58)]">
                <feature.icon className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.85} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[var(--ink)]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{feature.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
