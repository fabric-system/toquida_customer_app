import { useEffect, useState } from 'react';
import { MarqueeText } from './MarqueeText';

type MarqueeRotatorProps = {
  messages: string[];
  className?: string;
  /** Ms each message stays before switching to the next */
  intervalMs?: number;
};

export function MarqueeRotator({
  messages,
  className = '',
  intervalMs = 9000,
}: MarqueeRotatorProps) {
  const items = messages.filter((m) => m.trim());
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [messages.join('\n')]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [items.length, intervalMs, messages.join('\n')]);

  if (!items.length) return null;

  return (
    <div className="companion-marquee-rotator" aria-live="polite">
      {items.map((text, i) => (
        <div
          key={`${i}-${text.slice(0, 24)}`}
          className={`companion-marquee-rotator__slide${i === index ? ' companion-marquee-rotator__slide--active' : ''}`}
          aria-hidden={i !== index}
        >
          <MarqueeText text={text} className={className} />
        </div>
      ))}
    </div>
  );
}
