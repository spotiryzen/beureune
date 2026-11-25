import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import type { ProjectItem } from '../data/portfolio';

interface CaseStudyModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onSelectProject: (direction: 'prev' | 'next') => void;
}

export function CaseStudyModal({
  project,
  onClose,
  onSelectProject,
}: CaseStudyModalProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onSelectProject('next');
      if (e.key === 'ArrowLeft') onSelectProject('prev');
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose, onSelectProject]);

  if (!project) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-study-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/45 p-4 backdrop-blur-[2px] md:p-8"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-[#D8D6CE] bg-[#F6F5F1] text-[#141413] shadow-[0_24px_64px_rgba(20,20,19,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D8D6CE] bg-[#F6F5F1]/95 px-6 py-4 backdrop-blur-sm md:px-10">
          <div className="font-mono-meta flex items-center gap-3 text-xs text-[#5C5B57]">
            <span className="text-[#002FA7]">{project.index}</span>
            <span aria-hidden="true">/</span>
            <span>{project.discipline}</span>
            <span aria-hidden="true">·</span>
            <span>{project.year}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup studi kasus"
            className="inline-flex h-11 w-11 items-center justify-center text-[#141413] transition-colors hover:bg-[#ECEAE4] hover:text-[#002FA7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002FA7]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-8 md:px-10 md:py-10">
          <div className="max-w-2xl">
            <h2
              id="case-study-title"
              className="font-display text-3xl font-semibold tracking-[-0.03em] text-[#141413] md:text-4xl"
              style={{ textWrap: 'balance' }}
            >
              {project.title}
            </h2>
            <p className="mt-2 text-base text-[#5C5B57]">{project.subtitle}</p>
          </div>

          {/* Editorial Media Frame */}
          <div className="mt-7 overflow-hidden border border-[#D8D6CE] bg-[#ECEAE4]">
            <div className="aspect-[16/10] w-full overflow-hidden bg-[#E2DFD7]">
              {!imageError ? (
                <img
                  src={project.image}
                  alt={project.imageAlt}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#ECEAE4] p-8">
                  <span className="font-mono-meta text-xs text-[#5C5B57]">
                    {project.title} — {project.year}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#D8D6CE] px-4 py-2.5 text-xs text-[#5C5B57]">
              <span>{project.caption}</span>
              <span className="font-mono-meta text-[#141413]">{project.metrics}</span>
            </div>
          </div>

          {/* Masalah / Eksekusi / Hasil */}
          <div className="mt-9 grid grid-cols-1 gap-8 border-t border-[#D8D6CE] pt-8 md:grid-cols-3 md:gap-10">
            <div>
              <h3 className="font-mono-meta text-xs font-medium text-[#5C5B57]">
                01. Masalah
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#141413]">
                {project.problem}
              </p>
            </div>
            <div>
              <h3 className="font-mono-meta text-xs font-medium text-[#5C5B57]">
                02. Eksekusi
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#141413]">
                {project.execution}
              </p>
            </div>
            <div>
              <h3 className="font-mono-meta text-xs font-medium text-[#5C5B57]">
                03. Hasil
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#141413]">
                {project.outcome}
              </p>
            </div>
          </div>

          {/* Perangkat & Sistem — Quiet Unboxed Text */}
          <div className="mt-9 flex flex-wrap items-baseline justify-between gap-4 border-t border-[#D8D6CE] pt-6">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#5C5B57]">
              <span className="font-mono-meta text-[#141413]">Perangkat &amp; Sistem:</span>
              {project.stack.map((item, idx) => (
                <span key={item} className="inline-flex items-center gap-2.5">
                  <span>{item}</span>
                  {idx < project.stack.length - 1 && (
                    <span aria-hidden="true" className="text-[#B8B5AC]">
                      ·
                    </span>
                  )}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectProject('prev')}
                className="inline-flex min-h-[40px] items-center gap-2 border border-[#D8D6CE] px-3.5 py-2 text-xs font-medium text-[#141413] transition-colors hover:border-[#141413] hover:bg-[#ECEAE4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002FA7]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sebelumnya</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectProject('next')}
                className="inline-flex min-h-[40px] items-center gap-2 border border-[#D8D6CE] px-3.5 py-2 text-xs font-medium text-[#141413] transition-colors hover:border-[#141413] hover:bg-[#ECEAE4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002FA7]"
              >
                <span>Berikutnya</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
