import type { ReactNode } from 'react'

interface PageIntroProps {
  eyebrow: string
  title: string
  description: string
  aside?: ReactNode
  actions?: ReactNode
}

export function PageIntro({
  eyebrow,
  title,
  description,
  aside,
  actions,
}: PageIntroProps) {
  return (
    <section className="panel page-intro-grid px-6 py-6 sm:px-8 sm:py-8">
      <div className="space-y-4">
        <p className="kicker">{eyebrow}</p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[var(--ink-soft)] sm:text-base">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      {aside ? (
        <div className="flex items-start justify-start lg:justify-end">
          {aside}
        </div>
      ) : null}
    </section>
  )
}
