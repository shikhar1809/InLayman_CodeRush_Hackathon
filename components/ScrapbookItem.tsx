
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Resizable } from 're-resizable';
import { GripHorizontal, X } from 'lucide-react';

interface ScrapbookItemProps {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  children: React.ReactNode;
  onResizeStop: (dWidth: number, dHeight: number) => void;
  onDelete?: () => void;
  isSelected?: boolean;
}

const ScrapbookItem: React.FC<ScrapbookItemProps> = ({ id, x, y, width, height, children, onResizeStop, onDelete, isSelected }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    left: x,
    top: y,
    position: 'absolute' as 'absolute',
    zIndex: isDragging || isSelected ? 50 : 10,
  };

  return (
    <div ref={setNodeRef} style={style} className={`group ${isDragging ? 'cursor-grabbing opacity-90' : ''}`}>
       <Resizable
         size={{ width: width || 'auto', height: height || 'auto' }}
         onResizeStop={(e, direction, ref, d) => {
            onResizeStop(d.width, d.height);
         }}
         enable={{ bottom: true, right: true, bottomRight: true }}
         handleClasses={{ bottomRight: 'opacity-0 group-hover:opacity-100 bg-stone-400 w-4 h-4 rounded-full transition-opacity' }}
       >
          <div className={`relative transition-all duration-200 ${isDragging ? 'shadow-paper-float rotate-1' : 'hover:shadow-md'}`}>
             
             {/* Drag Handle */}
             <div 
                {...listeners} 
                {...attributes} 
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/90 border border-stone-200 rounded-full p-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-sm hover:scale-110"
                title="Drag"
             >
                <GripHorizontal size={12} className="text-stone-500" />
             </div>

             {/* Delete Button */}
             {onDelete && (
                 <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute -top-3 -right-3 bg-red-100 border border-red-200 rounded-full p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-sm hover:bg-red-200 text-red-500 hover:scale-110"
                    title="Remove"
                    onPointerDown={(e) => e.stopPropagation()} 
                 >
                     <X size={12} />
                 </button>
             )}
             
             {children}
          </div>
       </Resizable>
    </div>
  );
};

export default ScrapbookItem;
