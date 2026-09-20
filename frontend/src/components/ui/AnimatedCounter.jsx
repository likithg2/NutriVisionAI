import { useEffect, useRef, useState } from "react";

export default function AnimatedCounter({ value, duration = 800, decimals = 0, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  const start = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    const startVal = 0;
    const step = (timestamp) => {
      if (!start.current) start.current = timestamp;
      const progress = Math.min((timestamp - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(parseFloat((startVal + (target - startVal) * eased).toFixed(decimals)));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration, decimals]);

  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}
