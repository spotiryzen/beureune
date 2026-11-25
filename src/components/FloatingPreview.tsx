import { useEffect, useRef, useState } from 'react';

export interface ActivePreview {
  image: string;
  imageAlt: string;
  caption: string;
}

interface FloatingPreviewProps {
  preview: ActivePreview | null;
}

export function FloatingPreview({ preview }: FloatingPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0, vx: 0 });
  const hasPointerRef = useRef(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [failedSrcs, setFailedSrcs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIsTouchDevice(coarse || reduced);

    if (coarse || reduced) return;

    const handlePointerMove = (e: PointerEvent) => {
      const cardWidth = 304;
      const cardHeight = 264;
      const pad = 24;

      let nextX = e.clientX + 28;
      let nextY = e.clientY - cardHeight * 0.45;

      if (nextX + cardWidth + pad > window.innerWidth) {
        nextX = e.clientX - cardWidth - 28;
      }
      if (nextY < pad) {
        nextY = pad;
      } else if (nextY + cardHeight + pad > window.innerHeight) {
        nextY = window.innerHeight - cardHeight - pad;
      }

      targetRef.current.x = nextX;
      targetRef.current.y = nextY;

      if (!hasPointerRef.current) {
        currentRef.current.x = nextX;
        currentRef.current.y = nextY;
        hasPointerRef.current = true;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let rafId = 0;
    const stiffness = 0.14;

    const animate = () => {
      const curr = currentRef.current;
      const target = targetRef.current;

      const dx = target.x - curr.x;
      const dy = target.y - curr.y;

      curr.x += dx * stiffness;
      curr.y += dy * stiffness;
      curr.vx = curr.vx * 0.78 + dx * 0.22;

      const tilt = Math.max(-5, Math.min(5, curr.vx * 0.06));

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${curr.x.toFixed(1)}px, ${curr.y.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
      }

      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  if (isTouchDevice) return null;

  const isVisible = Boolean(preview);
  const hasFailed = preview ? failedSrcs[preview.image] : false;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none fixed top-0 left-0 z-40 w-[304px] transition-opacity duration-200 ease-out will-change-transform ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="overflow-hidden border border-[#D8D6CE] bg-[#ECEAE4] p-2 shadow-[0_18px_40px_rgba(20,20,19,0.12)]">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E2DFD7]">
          {preview && !hasFailed ? (
            <img
              src={preview.image}
              alt={preview.imageAlt}
              referrerPolicy="no-referrer"
              onError={() =>
                setFailedSrcs((prev) => ({
                  ...prev,
                  [preview.image]: true,
                }))
              }
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#ECEAE4] p-6 text-center">
              <span className="font-mono-meta text-xs text-[#5C5B57]">
                {preview?.caption ?? 'Pratinjau Proyek'}
              </span>
            </div>
          )}
        </div>
        {preview && (
          <div className="mt-2 flex items-center justify-between px-0.5 pt-0.5">
            <span className="font-mono-meta truncate text-[11px] tracking-tight text-[#141413]">
              {preview.caption}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
