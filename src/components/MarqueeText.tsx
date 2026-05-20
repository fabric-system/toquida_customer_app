import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

type MarqueeTextProps = {
  text: string;
  className?: string;
};

export function MarqueeText({ text, className = '' }: MarqueeTextProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scroll, setScroll] = useState(false);
  const [duration, setDuration] = useState(12);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const label = textRef.current;
    if (!viewport || !label) return;

    const overflow = label.scrollWidth - viewport.clientWidth;
    if (overflow > 6) {
      setScroll(true);
      setDistance(overflow);
      setDuration(Math.max(10, overflow / 24));
    } else {
      setScroll(false);
      setDistance(0);
    }
  }, [text]);

  return (
    <div ref={viewportRef} className="companion-marquee">
      <span
        ref={textRef}
        className={`companion-marquee__text ${className}${scroll ? ' companion-marquee__text--scroll' : ''}`}
        style={
          scroll
            ? ({
                animationDuration: `${duration}s`,
                ['--marquee-distance' as string]: `-${distance}px`,
              } as CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
}
