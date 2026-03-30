import { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';

export default function HanziDisplay({ character, size = 100, animateClass = false }) {
  const containerRef = useRef(null);
  const writerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !character) return;

    // Clear previous
    containerRef.current.innerHTML = '';

    const writer = HanziWriter.create(containerRef.current, character, {
      width: size,
      height: size,
      padding: 5,
      strokeColor: '#ec4899', // var(--accent-primary) equivalent
      radicalColor: '#8b5cf6', // var(--accent-secondary)
      outlineColor: 'rgba(255, 255, 255, 0.2)',
      showCharacter: false, 
      showOutline: true,
    });

    writerRef.current = writer;

    if (animateClass) {
      writer.animateCharacter();
    } else {
      writer.showCharacter();
    }

    return () => {
      // cleanup if needed
    };
  }, [character, size, animateClass]);

  const handleAnimate = () => {
    if (writerRef.current) {
      writerRef.current.animateCharacter();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="hanzi-container"
      onClick={handleAnimate}
      style={{ cursor: 'pointer', display: 'inline-block', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px' }}
      title="Click to animate stroke order"
    >
    </div>
  );
}
