
import { KnowledgeGraphData, KnowledgeNode, KnowledgeLink } from '../types';

const GRAPH_KEY = 'inlayman_knowledge_graph';

export const knowledgeGraphService = {
  getGraph: (): KnowledgeGraphData => {
    const raw = localStorage.getItem(GRAPH_KEY);
    if (!raw) return { nodes: [], links: [] };
    return JSON.parse(raw);
  },

  addTopic: (topic: string, relatedTo?: string) => {
    const graph = knowledgeGraphService.getGraph();
    
    // Check if node exists
    if (!graph.nodes.find(n => n.id === topic)) {
      graph.nodes.push({ id: topic, group: 1, val: 10 });
      
      // Link to related topic (e.g., prerequisite) or just random existing for density
      if (relatedTo && graph.nodes.find(n => n.id === relatedTo)) {
        graph.links.push({ source: relatedTo, target: topic });
      } else if (graph.nodes.length > 1) {
         // Auto-link to last added node to create a chain if no parent specified
         const lastNode = graph.nodes[graph.nodes.length - 2];
         graph.links.push({ source: lastNode.id, target: topic });
      }
      
      localStorage.setItem(GRAPH_KEY, JSON.stringify(graph));
    }
  },
  
  // Seed some data for visualization if empty
  seed: () => {
    if (knowledgeGraphService.getGraph().nodes.length === 0) {
      const data: KnowledgeGraphData = {
        nodes: [
          { id: "APIs", group: 1, val: 20 },
          { id: "HTTP", group: 1, val: 10 },
          { id: "JSON", group: 1, val: 10 },
          { id: "Databases", group: 2, val: 20 },
          { id: "SQL", group: 2, val: 10 },
        ],
        links: [
          { source: "APIs", target: "HTTP" },
          { source: "APIs", target: "JSON" },
          { source: "Databases", target: "SQL" },
          { source: "APIs", target: "Databases" }
        ]
      };
      localStorage.setItem(GRAPH_KEY, JSON.stringify(data));
    }
  }
};
