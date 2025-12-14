
import { useRef, useCallback } from 'react';

export const useBlockRegistry = () => {
    const blockRefs = useRef<Map<string, HTMLElement>>(new Map());

    const registerBlock = useCallback((id: string, node: HTMLElement | null) => {
        if (node) {
            blockRefs.current.set(id, node);
        } else {
            blockRefs.current.delete(id);
        }
    }, []);

    const getIntersectingBlocks = useCallback((selectionRect: { x: number, y: number, width: number, height: number }, containerRect: DOMRect) => {
        const intersectingIds: string[] = [];
        
        blockRefs.current.forEach((el, id) => {
            const bRect = el.getBoundingClientRect();
            
            // Convert block rect to relative coordinates within paper container
            const relativeX = bRect.left - containerRect.left;
            const relativeY = bRect.top - containerRect.top;

            // AABB Collision Detection (Axis-Aligned Bounding Box)
            if (
                selectionRect.x < relativeX + bRect.width &&
                selectionRect.x + selectionRect.width > relativeX &&
                selectionRect.y < relativeY + bRect.height &&
                selectionRect.y + selectionRect.height > relativeY
            ) {
                intersectingIds.push(id);
            }
        });

        return intersectingIds;
    }, []);

    return { registerBlock, getIntersectingBlocks };
};
