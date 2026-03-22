import React, { useState, useRef, useEffect } from 'react';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const SlideAction = ({ type, onComplete, theme }) => {
  const [dragX, setDragX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  const isBlock = type === 'block';
  const color = isBlock ? '#ef4444' : '#06b6d4';
  const icon = isBlock ? <LockIcon sx={{ fontSize: 20 }} /> : <LockOpenIcon sx={{ fontSize: 20 }} />;
  const label = isBlock ? 'DESLIZE PARA BLOQUEAR' : 'DESLIZE PARA LIBERAR';

  const handleStart = (clientX) => {
    setIsAnimating(false);
    containerRef.current.startX = clientX;
  };

  const handleMove = (clientX) => {
    if (containerRef.current.startX === undefined) return;
    const delta = clientX - containerRef.current.startX;
    const maxDrag = trackRef.current.offsetWidth - 56; // 56 is thumb width (48px + 8px gap)
    const newDragX = Math.max(0, Math.min(delta, maxDrag));
    setDragX(newDragX);
  };

  const handleEnd = () => {
    if (containerRef.current.startX === undefined) return;
    const maxDrag = trackRef.current.offsetWidth - 56;
    if (dragX > maxDrag * 0.8) {
      setDragX(maxDrag);
      onComplete();
      setTimeout(() => {
        setIsAnimating(true);
        setDragX(0);
      }, 500);
    } else {
      setIsAnimating(true);
      setDragX(0);
    }
    containerRef.current.startX = undefined;
  };

  return (
    <div
      ref={trackRef}
      className="relative w-full h-[56px] rounded-2xl flex items-center px-1 overflow-hidden select-none"
      style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientX)}
    >
      {/* Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 text-slate-900">
          {label}
        </span>
      </div>

      {/* Track Overlay (Glow) */}
      <div 
        className="absolute left-0 top-0 bottom-0 pointer-events-none"
        style={{ 
            width: dragX + 56, 
            background: `linear-gradient(90deg, ${color}33 0%, ${color}11 100%)`,
            transition: isAnimating ? 'width 0.3s ease' : 'none'
        }}
      />

      {/* Thumb / Slider */}
      <div
        className="relative w-11 h-11 rounded-xl shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
        style={{
          background: color,
          transform: `translateX(${dragX}px)`,
          transition: isAnimating ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          color: 'white',
          boxShadow: `0 4px 12px ${color}4d`
        }}
        onMouseMove={(e) => {
            if (e.buttons === 1) handleMove(e.clientX);
        }}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        {dragX > 20 ? icon : <ArrowForwardIcon sx={{ fontSize: 20 }} />}
      </div>
    </div>
  );
};

export default SlideAction;
