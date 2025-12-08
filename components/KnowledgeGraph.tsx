import React, { useEffect, useRef } from 'react';
import * as d3Base from 'd3';
import { knowledgeGraphService } from '../services/knowledgeGraphService';

const d3 = d3Base as any;

const KnowledgeGraph: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        knowledgeGraphService.seed(); // Mock data if empty
        const data = knowledgeGraphService.getGraph();
        
        if (!svgRef.current || data.nodes.length === 0) return;

        const width = 800;
        const height = 500;
        
        // Clear previous
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .attr("width", "100%")
            .attr("height", "100%");

        const simulation = d3.forceSimulation(data.nodes as any)
            .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.append("g")
            .selectAll("line")
            .data(data.links)
            .join("line")
            .attr("stroke", "#475569")
            .attr("stroke-width", 2);

        const node = svg.append("g")
            .selectAll("g")
            .data(data.nodes)
            .join("g")
            .call(d3.drag()
                .on("start", (event, d: any) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (event, d: any) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on("end", (event, d: any) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }) as any);

        node.append("circle")
            .attr("r", (d) => d.val)
            .attr("fill", "#06b6d4")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);

        node.append("text")
            .text((d) => d.id)
            .attr("x", 15)
            .attr("y", 5)
            .attr("fill", "#e2e8f0")
            .attr("font-size", "12px")
            .attr("font-weight", "bold");

        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });

    }, []);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-hidden">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">My Second Brain</h3>
            <svg ref={svgRef} className="w-full h-[400px]"></svg>
        </div>
    );
};

export default KnowledgeGraph;