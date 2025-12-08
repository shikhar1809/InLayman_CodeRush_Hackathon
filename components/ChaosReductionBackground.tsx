
import React, { useEffect, useRef } from 'react';

const ChaosReductionBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Entities
    const targets: { x: number, y: number, z: number, id: number, text: string }[] = [];
    const particles: { x: number, y: number, vx: number, vy: number, life: number, color: string }[] = [];
    const lasers: { x: number, y: number, tx: number, ty: number, life: number }[] = [];
    
    let frame = 0;

    const spawnTarget = () => {
        targets.push({
            x: Math.random() * width,
            y: Math.random() * (height * 0.5), // Top 50%
            z: Math.random() * 1.5 + 0.5, // Scale/Depth factor
            id: Date.now() + Math.random(),
            text: "?"
        });
    };

    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        
        // Spawn Targets occasionally
        if (frame % 80 === 0 && targets.length < 8) spawnTarget();

        // Update & Draw Targets (Question Marks)
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let i = targets.length - 1; i >= 0; i--) {
            const t = targets[i];
            t.y += 0.1 * t.z; // Float down slowly
            t.x += Math.sin(frame * 0.01 + t.id) * 0.3; // Gentle drift

            const opacity = Math.min(0.3, t.z * 0.2); // Low opacity to not distract
            ctx.fillStyle = `rgba(244, 63, 94, ${opacity})`; // Reddish tint for confusion
            const size = 60 * t.z;
            ctx.font = `bold ${size}px sans-serif`;
            ctx.fillText(t.text, t.x, t.y);

            // Remove if off screen
            if (t.y > height + 100) targets.splice(i, 1);
        }

        // Turret Logic (Bottom Center)
        const tx = width / 2;
        const ty = height;
        
        // Find nearest target
        let nearestDist = Infinity;
        let targetIdx = -1;
        targets.forEach((t, i) => {
            const dx = t.x - tx;
            const dy = t.y - ty;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < nearestDist) {
                nearestDist = dist;
                targetIdx = i;
            }
        });

        // Fire Laser occasionally
        if (targetIdx !== -1 && frame % 120 === 0) {
            const target = targets[targetIdx];
            lasers.push({ x: tx, y: ty, tx: target.x, ty: target.y, life: 20 });
            
            // Explosion particles at target
            for(let p=0; p<12; p++) {
                particles.push({
                    x: target.x,
                    y: target.y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 40,
                    color: '#06b6d4' // Primary Cyan
                });
            }
            targets.splice(targetIdx, 1);
        }

        // Draw Lasers
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let i = lasers.length - 1; i >= 0; i--) {
            const l = lasers[i];
            const alpha = l.life / 20;
            
            // Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#06b6d4';
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
            
            ctx.beginPath();
            ctx.moveTo(l.x, l.y);
            ctx.lineTo(l.tx, l.ty);
            ctx.stroke();
            
            ctx.shadowBlur = 0; // Reset
            
            l.life--;
            if(l.life <= 0) lasers.splice(i, 1);
        }

        // Draw Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 40;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
            
            if(p.life <= 0) particles.splice(i, 1);
        }
        ctx.globalAlpha = 1;

        frame++;
        requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);

    return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export default ChaosReductionBackground;
