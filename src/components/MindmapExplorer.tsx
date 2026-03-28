import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Check, X, Sparkles, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { withKeyRotation } from '../utils/geminiClient';
import { getErrorMessage } from '../utils/errorHandler';
import { Tooltip } from './Tooltip';

export interface MindmapNode {
  id: string;
  name: string;
  type: 'root' | 'competitor' | 'category' | 'insight' | 'note';
  content?: string;
  children?: MindmapNode[];
  isExpanded?: boolean;
  tags?: string[];
  linkedCards?: string[];
}

interface MindmapExplorerProps {
  initialData: MindmapNode;
  competitors?: any[];
  insights?: any[];
  rawDataSources?: any[];
}

export function MindmapExplorer({ initialData, competitors = [], insights = [], rawDataSources = [] }: MindmapExplorerProps) {
  const [data, setData] = useState<MindmapNode>(initialData);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  // Setup zoom
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });
    
    svg.call(zoom as any);
    
    // Initial center
    const { width, height } = containerRef.current.getBoundingClientRect();
    svg.call(zoom.transform as any, d3.zoomIdentity.translate(width / 4, height / 2).scale(0.8));
  }, []);

  // Compute layout
  const root = useMemo(() => {
    const hierarchy = d3.hierarchy(data, d => d.isExpanded ? d.children : null);
    
    // We'll use a tree layout
    const treeLayout = d3.tree<MindmapNode>()
      .nodeSize([80, 250]) // [height, width] spacing
      .separation((a, b) => a.parent === b.parent ? 1 : 1.2);
      
    return treeLayout(hierarchy);
  }, [data]);

  const toggleNode = (id: string) => {
    setData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const toggle = (node: MindmapNode) => {
        if (node.id === id) {
          node.isExpanded = !node.isExpanded;
          return true;
        }
        if (node.children) {
          for (const child of node.children) {
            if (toggle(child)) return true;
          }
        }
        return false;
      };
      toggle(newData);
      return newData;
    });
  };

  const updateNodeName = (id: string, newName: string) => {
    setData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const update = (node: MindmapNode) => {
        if (node.id === id) {
          node.name = newName;
          return true;
        }
        if (node.children) {
          for (const child of node.children) {
            if (update(child)) return true;
          }
        }
        return false;
      };
      update(newData);
      return newData;
    });
    setEditingNodeId(null);
  };

  const addNode = (parentId: string, type: MindmapNode['type'] = 'note') => {
    setData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const add = (node: MindmapNode) => {
        if (node.id === parentId) {
          if (!node.children) node.children = [];
          const newNodeId = `node-${Date.now()}`;
          node.children.push({
            id: newNodeId,
            name: 'New Node',
            type,
            isExpanded: true
          });
          node.isExpanded = true;
          return true;
        }
        if (node.children) {
          for (const child of node.children) {
            if (add(child)) return true;
          }
        }
        return false;
      };
      add(newData);
      return newData;
    });
  };

  const deleteNode = (id: string) => {
    if (id === 'root') return;
    setData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const remove = (node: MindmapNode) => {
        if (node.children) {
          const idx = node.children.findIndex(c => c.id === id);
          if (idx > -1) {
            node.children.splice(idx, 1);
            return true;
          }
          for (const child of node.children) {
            if (remove(child)) return true;
          }
        }
        return false;
      };
      remove(newData);
      return newData;
    });
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const generateInsight = async (nodeId: string) => {
    // Find node context
    let contextPath: string[] = [];
    let targetNode: MindmapNode | null = null;
    const findPath = (node: MindmapNode, path: string[]): boolean => {
      if (node.id === nodeId) {
        contextPath = [...path, node.name];
        targetNode = node;
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (findPath(child, [...path, node.name])) return true;
        }
      }
      return false;
    };
    findPath(data, []);

    setIsGenerating(true);
    try {
      const response = await withKeyRotation(async (ai, model) => {
        return await ai.models.generateContent({
        model: model,
        contents: `Based on this mindmap path: ${contextPath.join(' > ')}.

Existing Competitors: ${JSON.stringify(competitors.map(c => c.name))}
Existing Insights: ${JSON.stringify(insights.map(i => i.title))}
Recent Raw Data: ${JSON.stringify(rawDataSources.slice(0, 10).map(r => r.sourceUrl))}

Generate a new strategic insight or idea that branches off from this node.
Return ONLY a JSON object with:
- name: brief, high-level strategic insight (max 10 words)
- content: detailed note explaining the insight. Use [[Card Name]] to link to relevant existing competitors, insights, or raw data URLs.
- tags: array of string tags (e.g. ["#pricing", "#strategy"])
- linkedCards: array of exact names of the competitors, insights, or URLs you linked to.
`,
        config: { responseMimeType: 'application/json' }
      });
      });

      let result = { name: 'New AI Insight', content: '', tags: [], linkedCards: [] };
      try {
        result = JSON.parse(response.text?.trim() || '{}');
      } catch(e) { console.error(getErrorMessage(e)); }
      
      setData(prev => {
        const newData = JSON.parse(JSON.stringify(prev));
        const add = (node: MindmapNode) => {
          if (node.id === nodeId) {
            if (!node.children) node.children = [];
            node.children.push({
              id: `ai-${Date.now()}`,
              name: result.name || 'New AI Insight',
              type: 'insight',
              content: result.content || '',
              tags: result.tags || [],
              linkedCards: result.linkedCards || [],
              isExpanded: true
            });
            node.isExpanded = true;
            return true;
          }
          if (node.children) {
            for (const child of node.children) {
              if (add(child)) return true;
            }
          }
          return false;
        };
        add(newData);
        return newData;
      });
    } catch (error) {
      console.error(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  

  // Render links
  const links = root.links();
  const linkGenerator = d3.linkHorizontal<any, any>()
    .x(d => d.y)
    .y(d => d.x);

  return (
    <div className="flex h-full w-full bg-[#F5F3ED] relative" ref={containerRef}>
      <svg ref={svgRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing">
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {/* Draw Links */}
          {links.map((link, i) => (
            <path
              key={`link-${i}`}
              d={linkGenerator(link) || undefined}
              fill="none"
              stroke="#8A9A8E"
              strokeWidth={1.5}
              strokeOpacity={0.4}
              className="transition-all duration-300"
            />
          ))}

          {/* Draw Nodes */}
          {root.descendants().map((node) => {
            const isSelected = selectedNodeId === node.data.id;
            const hasChildren = !!node.data.children?.length;
            
            return (
              <g 
                key={node.data.id} 
                transform={`translate(${node.y},${node.x})`}
                className="transition-all duration-300"
              >
                <foreignObject 
                  x={-20} 
                  y={-24} 
                  width={300} 
                  height={200}
                  className="overflow-visible"
                >
                  <div 
                    className={`
                      relative flex items-center p-2 rounded-lg border-2 shadow-sm cursor-pointer transition-all
                      ${isSelected ? 'border-[#4A7C59] shadow-md ring-2 ring-[#4A7C59]/20' : 'border-[#8A9A8E]/30 hover:border-[#8A9A8E]'}
                      ${node.data.type === 'root' ? 'bg-[#4A7C59] text-white font-bold' : 
                        node.data.type === 'competitor' ? 'bg-white text-[#2C2C2C] font-semibold' :
                        node.data.type === 'category' ? 'bg-[#F5F3ED] text-[#4A7C59] font-medium border-dashed' :
                        node.data.type === 'insight' ? 'bg-[#FFF9E6] text-[#8B5A2B] border-[#D9A05B]/50' :
                        'bg-white text-[#2C2C2C]'}
                    `}
                    style={{ width: 'max-content', maxWidth: '200px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.data.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingNodeId(node.data.id);
                      setEditValue(node.data.name);
                    }}
                  >
                    {/* Expand/Collapse Toggle */}
                    {hasChildren && (
                      <button 
                        className={`absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-[#8A9A8E] flex items-center justify-center text-[#4A7C59] hover:bg-[#F5F3ED] z-10 transition-transform ${node.data.isExpanded ? '' : '-rotate-90'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(node.data.id);
                        }}
                      >
                        <ChevronDown size={12} />
                      </button>
                    )}

                    {editingNodeId === node.data.id ? (
                      <div className="flex items-center gap-1">
                        <input 
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') updateNodeName(node.data.id, editValue);
                            if (e.key === 'Escape') setEditingNodeId(null);
                          }}
                          className="bg-transparent border-b border-current outline-none px-1 py-0.5 text-sm w-full"
                        />
                        <button onClick={() => updateNodeName(node.data.id, editValue)} className="p-1 hover:bg-black/10 rounded">
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm leading-tight break-words pr-2">
                        {node.data.name}
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Side Panel for Selected Node */}
      <AnimatePresence>
        {selectedNodeId && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-[#8A9A8E]/20 shadow-xl flex flex-col z-20"
          >
            {(() => {
              // Find selected node
              let selectedNode: MindmapNode | null = null;
              const findNode = (n: MindmapNode) => {
                if (n.id === selectedNodeId) selectedNode = n;
                if (n.children) n.children.forEach(findNode);
              };
              findNode(data);

              if (!selectedNode) return null;

              return (
                <>
                  <div className="p-4 border-b border-[#8A9A8E]/20 flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-[#8A9A8E] uppercase tracking-wider mb-1">{selectedNode.type}</div>
                      <h3 className="text-lg font-bold text-[#2C2C2C]">{selectedNode.name}</h3>
                    </div>
                    <button onClick={() => setSelectedNodeId(null)} className="text-[#8A9A8E] hover:text-[#2C2C2C]">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto space-y-6">
                    {/* Actions */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#2C2C2C] uppercase tracking-wider">Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Tooltip content="Add a new child note to this node" position="top">
                          <button 
                            onClick={() => addNode(selectedNode!.id, 'note')}
                            className="flex items-center justify-center gap-2 p-2 w-full bg-[#F5F3ED] hover:bg-[#E8E6E0] rounded-lg text-sm text-[#2C2C2C] transition-colors"
                          >
                            <Plus size={16} /> Add Note
                          </button>
                        </Tooltip>
                        <Tooltip content="Generate an AI insight based on this node's context" position="top">
                          <button 
                            onClick={() => generateInsight(selectedNode!.id)}
                            disabled={isGenerating}
                            className="flex items-center justify-center gap-2 p-2 w-full bg-[#FFF9E6] hover:bg-[#FFE0B2] border border-[#D9A05B]/30 rounded-lg text-sm text-[#8B5A2B] transition-colors disabled:opacity-50"
                          >
                            {isGenerating ? <div className="w-4 h-4 border-2 border-[#8B5A2B] border-t-transparent rounded-full animate-spin" /> : <Sparkles size={16} />}
                            AI Insight
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {selectedNode.tags && selectedNode.tags.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#2C2C2C] uppercase tracking-wider">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedNode.tags.map(t => (
                            <span key={t} className="px-2 py-1 bg-[#4A7C59]/10 text-[#4A7C59] text-xs rounded-full">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedNode.linkedCards && selectedNode.linkedCards.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#2C2C2C] uppercase tracking-wider">Linked Cards</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedNode.linkedCards.map(c => (
                            <span key={c} className="px-2 py-1 bg-[#2C2C2C] text-white text-xs rounded-md shadow-sm">[[{c}]]</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content / Notes */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#2C2C2C] uppercase tracking-wider">Definitive Knowledge</h4>
                      <textarea 
                        className="w-full h-48 p-3 bg-[#F5F3ED] border border-[#8A9A8E]/20 rounded-lg text-sm text-[#2C2C2C] focus:outline-none focus:border-[#4A7C59] resize-none"
                        placeholder="Store definitive notes, links, or synthesized knowledge here..."
                        value={selectedNode.content || ''}
                        onChange={(e) => {
                          setData(prev => {
                            const newData = JSON.parse(JSON.stringify(prev));
                            const updateContent = (n: MindmapNode) => {
                              if (n.id === selectedNode!.id) {
                                n.content = e.target.value;
                                return true;
                              }
                              if (n.children) {
                                for (const c of n.children) {
                                  if (updateContent(c)) return true;
                                }
                              }
                              return false;
                            };
                            updateContent(newData);
                            return newData;
                          });
                        }}
                      />
                    </div>

                    {/* Danger Zone */}
                    {selectedNode.id !== 'root' && (
                      <div className="pt-8">
                        <Tooltip content="Delete this node and all its children" position="top">
                          <button 
                            onClick={() => deleteNode(selectedNode!.id)}
                            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} /> Delete Node
                          </button>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
