'use client';

import { useEffect, useRef } from 'react';
import styles from './login.module.css';

// A woven torus: individual signals coming together into one continuous surface.
export default function SignalSculpture() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let frame = 0;
    let phase = 0;
    let lastTime = 0;
    let visible = true;
    const pointer = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const scale = Math.min(width, height) * 0.29;
      const turn = -0.36 + phase * 0.13 + tilt.x;
      const lean = 0.88 + tilt.y;
      const cosTurn = Math.cos(turn);
      const sinTurn = Math.sin(turn);
      const cosLean = Math.cos(lean);
      const sinLean = Math.sin(lean);
      const project = (u: number, v: number) => {
        const ripple = 0.055 * Math.sin(u * 3 + phase);
        const radius = 1 + (0.39 + ripple) * Math.cos(v);
        const x = radius * Math.cos(u);
        const y = radius * Math.sin(u);
        const z = (0.39 + ripple) * Math.sin(v) + 0.12 * Math.sin(u * 2 + phase * 0.5);
        const rx = x * cosTurn - z * sinTurn;
        const rz = x * sinTurn + z * cosTurn;
        const ry = y * cosLean - rz * sinLean;
        const depth = y * sinLean + rz * cosLean;
        const perspective = 3.8 / (3.8 - depth);
        // A final diagonal rotation keeps the silhouette sculptural.
        return {
          x: width / 2 + (rx * 0.9 - ry * 0.435) * scale * perspective,
          y: height / 2 + (rx * 0.435 + ry * 0.9) * scale * perspective,
          depth,
        };
      };

      context.lineWidth = 0.65;
      for (let strand = 0; strand < 58; strand++) {
        const v = strand / 58 * Math.PI * 2;
        let previous = project(0, v);
        for (let step = 1; step <= 160; step++) {
          const u = step / 160 * Math.PI * 2;
          const point = project(u, v + u * 3);
          const light = (point.depth + 1.5) / 3;
          context.strokeStyle = `rgba(193, 151, 255, ${0.08 + light * 0.42})`;
          context.beginPath();
          context.moveTo(previous.x, previous.y);
          context.lineTo(point.x, point.y);
          context.stroke();
          if (step % 3 === 0) {
            context.fillStyle = `rgba(225, 204, 255, ${0.2 + light * 0.65})`;
            const size = 0.65 + light * 0.65;
            context.fillRect(point.x - size / 2, point.y - size / 2, size, size);
          }
          previous = point;
        }
      }

      // Bright signals travel along the weave.
      for (let i = 0; i < 14; i++) {
        const u = i * 2.39996 + phase * 0.24;
        const point = project(u, i * 1.7 + u * 3);
        context.shadowColor = '#c9a4ff';
        context.shadowBlur = 12;
        context.fillStyle = '#f2e8ff';
        context.beginPath();
        context.arc(point.x, point.y, 1.6, 0, Math.PI * 2);
        context.fill();
      }
      context.shadowBlur = 0;
    };

    const tick = (time: number) => {
      frame = 0;
      if (!visible || document.hidden || motion.matches) return;
      if (time - lastTime >= 1000 / 30) {
        phase += Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;
        tilt.x += (pointer.x - tilt.x) * 0.035;
        tilt.y += (pointer.y - tilt.y) * 0.035;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const syncAnimation = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = performance.now();
      draw();
      if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    });
    const move = (event: PointerEvent) => {
      if (motion.matches || event.pointerType === 'touch') return;
      const bounds = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.5;
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.35;
    };
    const reset = () => { pointer.x = 0; pointer.y = 0; };

    resize.observe(canvas);
    intersection.observe(canvas);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', reset);
    motion.addEventListener('change', syncAnimation);
    document.addEventListener('visibilitychange', syncAnimation);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', reset);
      motion.removeEventListener('change', syncAnimation);
      document.removeEventListener('visibilitychange', syncAnimation);
    };
  }, []);

  return (
    <div className={styles.artwork} aria-hidden="true">
      <div className={styles.sculpture}>
        <div className={styles.orbit} />
        <div className={styles.orbitInner} />
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </div>
  );
}
