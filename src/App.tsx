import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import {
  BIO_KEYWORDS,
  PROFILE,
  PROJECTS,
  type BioKeywordPreview,
  type ProjectItem,
} from './data/portfolio';
import { FloatingPreview, type ActivePreview } from './components/FloatingPreview';
import { MagneticButton } from './components/MagneticButton';
import { CaseStudyModal } from './components/CaseStudyModal';
import { N8nChatWidget } from './components/N8nChatWidget';

function formatBandaAcehTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: PROFILE.timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export default function App() {
  const [localTime, setLocalTime] = useState<string>(() =>
    formatBandaAcehTime(new Date()),
  );
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Live WIB clock (Banda Aceh, Indonesia)
  useEffect(() => {
    const interval = window.setInterval(() => {
      setLocalTime(formatBandaAcehTime(new Date()));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Scroll-reveal IntersectionObserver
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>('.scroll-reveal');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const selectedProject: ProjectItem | null =
    PROJECTS.find((p) => p.id === selectedProjectId) ?? null;

  const handleCycleProject = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedProjectId) return;
      const currentIdx = PROJECTS.findIndex((p) => p.id === selectedProjectId);
      if (currentIdx === -1) return;
      const delta = direction === 'next' ? 1 : -1;
      const nextIdx = (currentIdx + delta + PROJECTS.length) % PROJECTS.length;
      setSelectedProjectId(PROJECTS[nextIdx].id);
    },
    [selectedProjectId],
  );

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2400);
    } catch {
      const fallbackInput = document.createElement('textarea');
      fallbackInput.value = PROFILE.email;
      fallbackInput.style.position = 'fixed';
      fallbackInput.style.opacity = '0';
      document.body.appendChild(fallbackInput);
      fallbackInput.select();
      document.execCommand('copy');
      document.body.removeChild(fallbackInput);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2400);
    }
  };

  const renderBioKeyword = (kw: BioKeywordPreview) => (
    <button
      type="button"
      onMouseEnter={() =>
        setActivePreview({
          image: kw.image,
          imageAlt: kw.imageAlt,
          caption: kw.caption,
        })
      }
      onMouseLeave={() => setActivePreview(null)}
      onFocus={() =>
        setActivePreview({
          image: kw.image,
          imageAlt: kw.imageAlt,
          caption: kw.caption,
        })
      }
      onBlur={() => setActivePreview(null)}
      onClick={() => {
        setActivePreview(null);
        setSelectedProjectId(kw.projectId);
      }}
      className="cursor-pointer border-b border-[#002FA7] pb-0.5 font-medium text-[#141413] transition-colors duration-200 hover:text-[#002FA7] focus-visible:text-[#002FA7] focus-visible:outline-none"
    >
      {kw.label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F6F5F1] text-[#141413]">
      {/* 1. Minimal Header */}
      <header className="sticky top-0 z-30 border-b border-[#D8D6CE] bg-[#F6F5F1]/92 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-8 px-6 md:px-12">
          <a
            href="#top"
            className="font-display shrink-0 whitespace-nowrap text-lg font-semibold tracking-[-0.03em] text-[#141413] transition-colors hover:text-[#002FA7]"
          >
            {PROFILE.name}
          </a>

          <div
            aria-label="Waktu lokal di Banda Aceh"
            className="font-mono-meta hidden items-center gap-2 whitespace-nowrap text-xs text-[#5C5B57] sm:flex"
          >
            <span>Banda Aceh</span>
            <span aria-hidden="true">—</span>
            <span>
              {PROFILE.timezoneLabel} {localTime}
            </span>
          </div>

          <nav aria-label="Navigasi utama" className="flex shrink-0 items-center gap-7">
            <a
              href="#work"
              className="link-underline whitespace-nowrap text-sm font-medium text-[#141413] transition-colors hover:text-[#002FA7]"
            >
              Karya
            </a>
            <a
              href="#contact"
              className="link-underline whitespace-nowrap text-sm font-medium text-[#141413] transition-colors hover:text-[#002FA7]"
            >
              Kontak
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* 2. Hero Section (The Hook) */}
        <section className="mx-auto max-w-[1280px] px-6 pt-12 pb-24 md:px-12 md:pt-20 md:pb-36">
          {/* Quiet Metadata Strip */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 border-b border-[#D8D6CE] pb-5 text-xs text-[#5C5B57]">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="font-medium text-[#141413]">{PROFILE.role}</span>
              <span aria-hidden="true">·</span>
              <span>{PROFILE.location}</span>
            </div>

            <div className="font-mono-meta flex items-center gap-2.5 text-[11px] tracking-tight text-[#141413]">
              <span
                aria-hidden="true"
                className="availability-breath inline-block h-2 w-2 rounded-full bg-[#002FA7]"
              />
              <span>{PROFILE.availability}</span>
            </div>
          </div>

          {/* Asymmetric Swiss Editorial Grid */}
          <div className="mt-14 grid grid-cols-1 gap-12 md:mt-20 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-10">
              <h1
                className="font-display text-[clamp(2.35rem,5.4vw,4.65rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-[#141413]"
                style={{ textWrap: 'balance' }}
              >
                {PROFILE.heroLines.map((line, index) => (
                  <span key={line} className="reveal-mask">
                    <span
                      className="reveal-line"
                      style={
                        {
                          '--reveal-delay': `${index * 110}ms`,
                        } as React.CSSProperties
                      }
                    >
                      {line}
                    </span>
                  </span>
                ))}
              </h1>
            </div>

            {/* Lower Asymmetric Split — Bio & Magnetic CTA + Generous Whitespace */}
            <div className="lg:col-span-7 lg:col-start-1 lg:pt-8">
              <p className="max-w-[58ch] text-lg leading-[1.65] text-[#5C5B57] md:text-[1.1875rem]">
                Mantan pimpinan operasional FMCG yang kini membangun sistem berbasis AI. Saya merancang{' '}
                {renderBioKeyword(BIO_KEYWORDS.chatbots)},{' '}
                {renderBioKeyword(BIO_KEYWORDS.media)}, dan{' '}
                {renderBioKeyword(BIO_KEYWORDS.interfaces)}.
              </p>

              <p className="font-mono-meta mt-4 hidden text-[11px] text-[#5C5B57] md:block">
                Arahkan kursor pada bidang bergaris bawah untuk pratinjau, atau klik untuk membaca studi kasus.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-7">
                <MagneticButton href="#work">Lihat karya pilihan</MagneticButton>
                <a
                  href="#contact"
                  className="link-underline text-sm font-medium text-[#141413] transition-colors hover:text-[#002FA7]"
                >
                  Mulai diskusi
                </a>
              </div>
            </div>

            {/* Right Asymmetric Editorial Column — Minimal Practice Notes */}
            <div className="flex flex-col justify-end border-t border-[#D8D6CE] pt-6 lg:col-span-4 lg:col-start-9 lg:border-t-0 lg:border-l lg:pt-8 lg:pl-8">
              <dl className="space-y-4 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="font-mono-meta text-xs text-[#5C5B57]">Fokus</dt>
                  <dd className="text-right text-[#141413]">
                    Otomasi n8n · Video Generatif
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-[#D8D6CE] pt-4">
                  <dt className="font-mono-meta text-xs text-[#5C5B57]">Latar Belakang</dt>
                  <dd className="text-right text-[#141413]">Operasional FMCG</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-[#D8D6CE] pt-4">
                  <dt className="font-mono-meta text-xs text-[#5C5B57]">Domisili</dt>
                  <dd className="font-mono-meta text-right text-xs text-[#141413]">
                    {PROFILE.location} ({localTime} {PROFILE.timezoneLabel})
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* 3. Selected Work (Interactive Index List) */}
        <section
          id="work"
          className="scroll-reveal mx-auto max-w-[1280px] px-6 py-20 md:px-12 md:py-28"
        >
          <div className="flex items-baseline justify-between gap-4 pb-6">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#141413] md:text-3xl">
              Karya Pilihan
            </h2>
            <span className="font-mono-meta text-xs text-[#5C5B57]">
              Indeks 01–0{PROJECTS.length}
            </span>
          </div>

          {/* Column Labels (Desktop) */}
          <div
            aria-hidden="true"
            className="font-mono-meta hidden grid-cols-12 items-center border-t border-[#D8D6CE] py-3 text-[11px] text-[#5C5B57] md:grid"
          >
            <span className="col-span-1">No.</span>
            <span className="col-span-6">Proyek</span>
            <span className="col-span-3">Disiplin</span>
            <span className="col-span-2 text-right">Tahun</span>
          </div>

          {/* Hairline Index Rows */}
          <ul className="border-t border-[#D8D6CE]">
            {PROJECTS.map((project) => (
              <li key={project.id} className="border-b border-[#D8D6CE]">
                <button
                  type="button"
                  onMouseEnter={() =>
                    setActivePreview({
                      image: project.image,
                      imageAlt: project.imageAlt,
                      caption: `${project.index} · ${project.subtitle}`,
                    })
                  }
                  onMouseLeave={() => setActivePreview(null)}
                  onFocus={() =>
                    setActivePreview({
                      image: project.image,
                      imageAlt: project.imageAlt,
                      caption: `${project.index} · ${project.subtitle}`,
                    })
                  }
                  onBlur={() => setActivePreview(null)}
                  onClick={() => {
                    setActivePreview(null);
                    setSelectedProjectId(project.id);
                  }}
                  className="group grid w-full cursor-pointer grid-cols-1 items-baseline gap-2 py-7 text-left transition-colors duration-200 hover:bg-[#ECEAE4]/70 focus-visible:bg-[#ECEAE4] focus-visible:outline-none md:grid-cols-12 md:items-center md:gap-4 md:px-2 md:py-8"
                >
                  {/* Index */}
                  <span className="font-mono-meta text-xs text-[#5C5B57] transition-colors duration-200 group-hover:text-[#002FA7] md:col-span-1">
                    {project.index}
                  </span>

                  {/* Title & Concise Descriptor */}
                  <div className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2.5 md:col-span-6">
                    <span className="font-display block text-2xl font-semibold tracking-[-0.025em] text-[#141413] transition-colors duration-200 group-hover:text-[#002FA7] md:text-[2rem]">
                      {project.title}
                    </span>
                    <span className="mt-1 block text-sm text-[#5C5B57]">
                      {project.subtitle}
                    </span>
                  </div>

                  {/* Discipline (Unboxed Clean Text) */}
                  <span className="mt-2 text-sm text-[#5C5B57] transition-colors duration-200 group-hover:text-[#141413] md:col-span-3 md:mt-0">
                    {project.discipline}
                  </span>

                  {/* Year & Affordance */}
                  <div className="mt-1 flex items-center justify-between md:col-span-2 md:mt-0 md:justify-end md:gap-4">
                    <span className="font-mono-meta text-xs text-[#5C5B57] transition-colors duration-200 group-hover:text-[#141413]">
                      {project.year}
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 text-[#5C5B57] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#002FA7]"
                      aria-hidden="true"
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* 4. Colophon & Direct Contact Footer */}
      <footer
        id="contact"
        className="scroll-reveal border-t border-[#D8D6CE] bg-[#ECEAE4]/55"
      >
        <div className="mx-auto max-w-[1280px] px-6 pt-20 pb-14 md:px-12 md:pt-28 md:pb-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="font-mono-meta text-xs text-[#5C5B57]">
                Kontak Langsung
              </p>
              <p
                className="mt-4 max-w-xl text-base leading-relaxed text-[#5C5B57] md:text-lg"
                style={{ textWrap: 'balance' }}
              >
                Punya alur operasional yang ingin diotomasi atau kebutuhan produksi visual berbasis AI? Kirim pesan langsung.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
                <a
                  href={`mailto:${PROFILE.email}`}
                  className="font-display break-all text-[clamp(1.65rem,4.2vw,3.35rem)] leading-none font-semibold tracking-[-0.03em] text-[#141413] transition-colors duration-200 hover:text-[#002FA7]"
                >
                  {PROFILE.email}
                </a>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:col-span-4 lg:items-end">
              <button
                type="button"
                onClick={handleCopyEmail}
                className={`inline-flex min-h-[46px] cursor-pointer items-center gap-2.5 border px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#002FA7] ${
                  copiedEmail
                    ? 'border-[#002FA7] bg-[#002FA7] text-[#F6F5F1]'
                    : 'border-[#141413] bg-transparent text-[#141413] hover:border-[#002FA7] hover:bg-[#002FA7] hover:text-[#F6F5F1]'
                }`}
              >
                {copiedEmail ? (
                  <>
                    <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Tersalin ke papan klip</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Salin email</span>
                  </>
                )}
              </button>
              <span className="font-mono-meta text-[11px] text-[#5C5B57]">
                Balasan dalam 24 jam · {PROFILE.timezoneLabel}
              </span>
            </div>
          </div>

          {/* Minimal Links & Colophon */}
          <div className="mt-16 flex flex-col justify-between gap-6 border-t border-[#D8D6CE] pt-8 text-sm md:mt-20 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
              <a
                href={PROFILE.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline inline-flex items-center gap-1 font-medium text-[#141413] transition-colors hover:text-[#002FA7]"
              >
                <span>Instagram {PROFILE.instagramHandle}</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a
                href={PROFILE.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline inline-flex items-center gap-1 text-[#5C5B57] transition-colors hover:text-[#141413]"
              >
                <span>GitHub</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a
                href={PROFILE.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline inline-flex items-center gap-1 text-[#5C5B57] transition-colors hover:text-[#141413]"
              >
                <span>LinkedIn</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>

            <div className="font-mono-meta flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#5C5B57]">
              <span>{PROFILE.location}</span>
              <span aria-hidden="true">·</span>
              <span>Disusun dengan Syne &amp; Plus Jakarta Sans</span>
              <span aria-hidden="true">·</span>
              <span>© 2026 {PROFILE.name}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Spring-interpolated Cursor Preview Floater (Desktop only) */}
      <FloatingPreview preview={activePreview} />

      {/* Case Study Detail Drawer/Modal */}
      <CaseStudyModal
        project={selectedProject}
        onClose={() => setSelectedProjectId(null)}
        onSelectProject={handleCycleProject}
      />

      {/* Widget Chatbot Webhook n8n */}
      <N8nChatWidget />

      {/* Clipboard Confirmation Toast */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed right-5 bottom-20 z-50 border border-[#002FA7] bg-[#141413] px-4 py-2.5 font-mono-meta text-xs text-[#F6F5F1] shadow-[0_12px_32px_rgba(20,20,19,0.2)] transition-all duration-200 sm:right-8 sm:bottom-24 ${
          copiedEmail
            ? 'translate-y-0 opacity-100'
            : 'translate-y-2 opacity-0'
        }`}
      >
        Tersalin ke papan klip ✓
      </div>
    </div>
  );
}
