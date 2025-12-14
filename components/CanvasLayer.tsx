
import React, { useRef, useEffect, useState } from 'react';

interface CanvasLayerProps {
  active: boolean;
  mode: 'pen' | 'lasso' | 'eraser';
  onLassoSelect: (rect: { x: number, y: number, width: number, height: number }) => void;
  paths?: Array<{points: {x: number, y: number}[], mode: 'pen' | 'lasso'}>;
  onPathAdd?: (path: {points: {x: number, y: number}[], mode: 'pen' | 'lasso'}) => void;
  onPathRemove?: (index: number) => void;
}

const CanvasLayer: React.FC<CanvasLayerProps> = ({ active, mode, onLassoSelect, paths = [], onPathAdd, onPathRemove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPath = useRef<{x: number, y: number}[]>([]);
  const requestRef = useRef<number | undefined>(undefined);
  const lastDrawnIndex = useRef<number>(0);

  // Redraw whenever external paths change
  useEffect(() => {
    redraw();
  }, [paths]);

  const redraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      
      // Clear entire backing store
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      paths.forEach(pathData => {
          if (pathData.points.length < 2) return;
          
          ctx.beginPath();
          ctx.moveTo(pathData.points[0].x, pathData.points[0].y);
          
          for (let i = 1; i < pathData.points.length; i++) {
              ctx.lineTo(pathData.points[i].x, pathData.points[i].y);
          }
          
          ctx.strokeStyle = pathData.mode === 'lasso' ? '#3b82f6' : '#2d2a2e';
          ctx.lineWidth = pathData.mode === 'lasso' ? 2 : 3;
          
          if (pathData.mode === 'lasso') ctx.setLineDash([5, 5]);
          else ctx.setLineDash([]);
          
          ctx.stroke();
      });
      
      ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Resize handling - match parent dimensions + High DPI support
    const resize = () => {
        const parent = canvas.parentElement;
        if (parent) {
            const rect = parent.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            // Set actual backing store size
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            
            // Enforce visual size via CSS
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            
            redraw();
        }
    };
    
    const resizeObserver = new ResizeObserver(() => resize());
    if (canvas.parentElement) {
        resizeObserver.observe(canvas.parentElement);
    }
    
    resize();
    
    return () => resizeObserver.disconnect();
  }, []);

  const getLocalCoords = (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      
      return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      };
  };

  // Helper for hit detection
  const isPointNearLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number, dist: number = 10) => {
      const A = px - x1;
      const B = py - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const len_sq = C * C + D * D;
      let param = -1;
      if (len_sq !== 0) // in case of 0 length line
          param = dot / len_sq;

      let xx, yy;

      if (param < 0) {
        xx = x1;
        yy = y1;
      }
      else if (param > 1) {
        xx = x2;
        yy = y2;
      }
      else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }

      const dx = px - xx;
      const dy = py - yy;
      return (dx * dx + dy * dy) < (dist * dist);
  }

  const startDrawing = (e: React.PointerEvent) => {
    if (!active) return;
    
    // Capture pointer to track even if it leaves canvas boundaries
    (e.target as Element).setPointerCapture(e.pointerId);

    setIsDrawing(true);
    const { x, y } = getLocalCoords(e);
    
    // If Eraser mode, try to erase immediately on click
    if (mode === 'eraser' && onPathRemove) {
        const hitIndex = paths.findIndex(path => {
            for (let i = 0; i < path.points.length - 1; i++) {
                if (isPointNearLine(x, y, path.points[i].x, path.points[i].y, path.points[i+1].x, path.points[i+1].y)) {
                    return true;
                }
            }
            return false;
        });
        if (hitIndex !== -1) {
            onPathRemove(hitIndex);
        }
        return; // Don't start drawing path
    }

    currentPath.current = [{ x, y }];
    lastDrawnIndex.current = 0;
    
    // Draw initial point (dot)
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.beginPath();
        ctx.arc(x, y, mode === 'lasso' ? 1 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = mode === 'lasso' ? '#3b82f6' : '#2d2a2e';
        ctx.fill();
        ctx.restore();
    }
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || !active) return;
    
    const { x, y } = getLocalCoords(e);
    
    // Eraser Logic while dragging
    if (mode === 'eraser' && onPathRemove) {
         if (!requestRef.current) {
             requestRef.current = requestAnimationFrame(() => {
                const hitIndex = paths.findIndex(path => {
                    for (let i = 0; i < path.points.length - 1; i++) {
                        if (isPointNearLine(x, y, path.points[i].x, path.points[i].y, path.points[i+1].x, path.points[i+1].y)) {
                            return true;
                        }
                    }
                    return false;
                });
                if (hitIndex !== -1) {
                    onPathRemove(hitIndex);
                }
                requestRef.current = undefined;
             });
         }
         return;
    }

    currentPath.current.push({ x, y });

    // Use requestAnimationFrame to sync with screen refresh
    if (requestRef.current) return;

    requestRef.current = requestAnimationFrame(() => {
        const ctx = canvasRef.current?.getContext('2d');
        const points = currentPath.current;
        
        if (ctx && points.length > 1 && lastDrawnIndex.current < points.length) {
            const dpr = window.devicePixelRatio || 1;
            
            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = mode === 'lasso' ? '#3b82f6' : '#2d2a2e';
            ctx.lineWidth = mode === 'lasso' ? 2 : 3;
            if (mode === 'lasso') ctx.setLineDash([5, 5]);
            else ctx.setLineDash([]);

            ctx.beginPath();
            
            // Start from the last point drawn to ensure continuity
            const startIndex = Math.max(0, lastDrawnIndex.current - 1);
            ctx.moveTo(points[startIndex].x, points[startIndex].y);

            // Draw all new segments
            for (let i = startIndex + 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            
            ctx.stroke();
            ctx.restore();
            
            lastDrawnIndex.current = points.length;
        }
        requestRef.current = undefined;
    });
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
    
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    if (currentPath.current.length > 0 && mode !== 'eraser') {
        if (mode === 'pen') {
            if (onPathAdd) {
                onPathAdd({ points: currentPath.current, mode: 'pen' });
            }
        } else if (mode === 'lasso') {
            // Calculate Bounding Box
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            currentPath.current.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            });
            
            // Clear the temporary lasso line visually (redraw saved paths)
            redraw();
            onLassoSelect({ x: minX, y: minY, width: maxX - minX, height: maxY - minY });
        }
    }
    currentPath.current = [];
    lastDrawnIndex.current = 0;
  };

  return (
    <canvas 
        ref={canvasRef}
        className={`absolute inset-0 z-30 ${active ? 'cursor-crosshair touch-none' : 'pointer-events-none'}`}
        style={{ willChange: 'contents' }}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
    />
  );
};

export default CanvasLayer;
