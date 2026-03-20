import React, { useRef, useState, useEffect } from 'react';
import { systemNodes, systemConnections } from '../../data/nodeMap';
import SystemMapNode from './SystemMapNode';
import SystemMapConnection from './SystemMapConnection';

export default function SystemMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 400 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full relative min-h-[350px] md:min-h-[400px] h-[50vh] max-h-[600px] bg-white rounded-xl border border-border-default flex-shrink-0 shadow-md">
      <h3 className="absolute top-4 left-4 font-sans text-xs font-semibold text-text-muted uppercase tracking-[0.12em] z-20 bg-white/90 px-2 py-1 rounded backdrop-blur border border-border-default/50">
        System Overview
      </h3>
      
      <svg className="w-full h-full absolute inset-0 z-0">
        {systemConnections.map((conn, i) => (
          <SystemMapConnection key={i} conn={conn} nodes={systemNodes} allConnections={systemConnections} dims={dims} />
        ))}
      </svg>
      
      <div className="absolute inset-0 z-10 pointer-events-none">
        {systemNodes.map(node => (
          <SystemMapNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
