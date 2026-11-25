import { useRef, useState, type ReactNode } from 'react';
import { ArrowDownRight } from 'lucide-react';

interface MagneticButtonProps {
  href: string;
  children: ReactNode;
  onClick?: () => void;
}

export function MagneticButton({ href, children, onClick }: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);

    setOffset({
      x: Math.max(-10, Math.min(10, relX * 0.22)),
      y: Math.max(-8, Math.min(8, relY * 0.28)),
    });
  };

  const handlePointerLeave = () => {
    setHovered(false);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <a
      ref={ref}
      href={href}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: `translate3d(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px, 0)`,
      }}
      className="group inline-flex min-h-[48px] items-center gap-3 whitespace-nowrap bg-[#002FA7] px-6 py-3.5 text-sm font-medium tracking-tight text-[#F6F5F1] transition-[transform,background-color] duration-200 ease-out hover:bg-[#00237D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#002FA7]"
    >
      <span>{children}</span>
      <ArrowDownRight
        className={`h-4 w-4 shrink-0 transition-transform duration-200 ease-out ${
          hovered ? 'translate-x-0.5 translate-y-0.5' : ''
        }`}
        aria-hidden="true"
      />
    </a>
  );
}
