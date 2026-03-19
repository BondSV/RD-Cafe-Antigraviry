import React from 'react';
import { systemNodes, systemConnections } from '../../data/nodeMap';
import SystemMapNode from './SystemMapNode';
import SystemMapConnection from './SystemMapConnection';

export default function SystemMap() {
  return (
    <div className="w-full relative min-h-[350px] md:min-h-[400px] h-[50vh] max-h-[600px] bg-bg-surface rounded-xl border border-border-default overflow-hidden flex-shrink-0 shadow-sm">
      <h3 className="absolute top-4 left-4 font-sans text-xs font-semibold text-text-secondary uppercase tracking-[0.12em] z-10 bg-bg-surface/80 px-2 py-1 rounded backdrop-blur">
        System Overview
      </h3>
      <svg className="w-full h-full absolute inset-0 pt-[30px]" preserveAspectRatio="xMidYMid slice">
        {systemConnections.map((conn, i) => (
          <SystemMapConnection key={i} conn={conn} nodes={systemNodes} />
        ))}
        {systemNodes.map(node => (
          <SystemMapNode key={node.id} node={node} />
        ))}
      </svg>
    </div>
  );
}
