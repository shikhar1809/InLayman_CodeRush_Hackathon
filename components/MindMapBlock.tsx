
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MindMapBlockProps {
  code: string;
}

const MindMapBlock: React.FC<MindMapBlockProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Re-initialize to ensure theme is applied correctly
    mermaid.initialize({ 
        startOnLoad: false, 
        theme: 'base',
        themeVariables: {
            primaryColor: '#ffffff',
            primaryTextColor: '#2d2a2e',
            primaryBorderColor: '#78716c',
            lineColor: '#57534e',
            secondaryColor: '#f5f5f4',
            tertiaryColor: '#ffffff'
        },
        fontFamily: 'Patrick Hand',
        securityLevel: 'loose'
    });

    const renderMap = async () => {
      if (containerRef.current && code) {
        try {
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            // Clear previous content
            containerRef.current.innerHTML = ''; 
            const { svg } = await mermaid.render(id, code);
            containerRef.current.innerHTML = svg;
        } catch (error) {
            console.error("Mermaid render error", error);
            containerRef.current.innerHTML = "<p class='text-red-400 text-xs font-mono p-2'>Map Syntax Error</p>";
        }
      }
    };

    renderMap();
  }, [code]);

  return (
    <div className="my-2 p-4 bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden flex flex-col items-center">
      <div className="w-full text-left text-[10px] font-bold text-stone-300 uppercase tracking-widest mb-2 border-b border-stone-100 pb-1">Mind Map</div>
      <div ref={containerRef} className="w-full flex justify-center mermaid-canvas" />
    </div>
  );
};

export default MindMapBlock;
