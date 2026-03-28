import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge as rfAddEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  useVisualKnowledgeStore,
  Card,
} from "../../store/visualKnowledgeStore";
import { CustomCardNode } from "./CustomCardNode";
import {
  Search,
  Plus,
  List,
  Grid,
  Settings,
  ExternalLink,
  X,
  HelpCircle,
} from "lucide-react";
import { templates } from "../../utils/mindmapTemplates";
import { MindmapAIChat } from "./MindmapAIChat";
import { GuidedTour, TourStep } from "../GuidedTour";
import { PageGuideModal } from "../PageGuideModal";
import { useOnboarding } from "../../hooks/useOnboarding";

import { dictionary, tMessage } from "../../content/dictionary";

const nodeTypes = {
  customCard: CustomCardNode,
};

const getTourSteps = (): TourStep[] => [
  {
    target: '[data-tour="whiteboard-list"]',
    title: tMessage(dictionary.whiteboard.tour.step_multiple_whiteboards.title),
    content: tMessage(
      dictionary.whiteboard.tour.step_multiple_whiteboards.content,
    ),
    placement: "right",
  },
  {
    target: '[data-tour="canvas-area"]',
    title: tMessage(dictionary.whiteboard.tour.step_infinite_canvas.title),
    content: tMessage(dictionary.whiteboard.tour.step_infinite_canvas.content),
    placement: "top",
  },
  {
    target: '[data-tour="card-tags"]',
    title: tMessage(dictionary.whiteboard.tour.step_visual_tagging.title),
    content: tMessage(dictionary.whiteboard.tour.step_visual_tagging.content),
    placement: "right",
  },
  {
    target: '[data-tour="ai-chat-input"]',
    title: tMessage(dictionary.whiteboard.tour.step_contextual_ai_chat.title),
    content: tMessage(
      dictionary.whiteboard.tour.step_contextual_ai_chat.content,
    ),
    placement: "top",
  },
  {
    target: '[data-tour="pin-to-board-btn"]',
    title: tMessage(dictionary.whiteboard.tour.step_pin_ai_insights.title),
    content: tMessage(dictionary.whiteboard.tour.step_pin_ai_insights.content),
    placement: "left",
  },
];

export function VisualWhiteboard() {
  const {
    whiteboards,
    activeWhiteboardId,
    cards,
    createWhiteboard,
    setActiveWhiteboard,
    updateCardInstancePosition,
    addEdge,
    removeEdge,
    addCard,
    placeCardOnWhiteboard,
  } = useVisualKnowledgeStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");

  const {
    isModalActive,
    isTourActive,
    completeModal,
    completeTour,
    skipAll,
    resetOnboarding,
  } = useOnboarding("hasSeenWhiteboardGuide", "hasSeenWhiteboardTour");

  const activeWhiteboard = activeWhiteboardId
    ? whiteboards[activeWhiteboardId]
    : null;

  // Sync ReactFlow state with our Zustand store when active whiteboard changes
  useEffect(() => {
    if (!activeWhiteboard) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Map store instances to ReactFlow Nodes
    const newNodes = activeWhiteboard.cardInstances.map((inst) => {
      const card = cards[inst.cardId];
      let isHidden = false;
      if (filterType !== "All" && card?.type !== filterType) {
        isHidden = true;
      }
      if (
        searchQuery &&
        !card?.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        isHidden = true;
      }

      return {
        id: inst.id,
        type: "customCard",
        position: inst.position,
        hidden: isHidden,
        data: {
          instanceId: inst.id,
          cardId: inst.cardId,
          whiteboardId: activeWhiteboardId,
        },
      };
    });

    // Map store edges to ReactFlow Edges
    const newEdges = activeWhiteboard.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type || "default",
      animated: true,
      style: { stroke: "#8A9A8E", strokeWidth: 2 },
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    activeWhiteboardId,
    activeWhiteboard?.cardInstances.length,
    activeWhiteboard?.edges.length,
    searchQuery,
    filterType,
  ]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      if (!activeWhiteboardId) return;
      addEdge(activeWhiteboardId, {
        source: params.source!,
        target: params.target!,
        type: "default",
      });
    },
    [activeWhiteboardId, addEdge],
  );

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (!activeWhiteboardId) return;
      updateCardInstancePosition(activeWhiteboardId, node.id, node.position);
    },
    [activeWhiteboardId, updateCardInstancePosition],
  );

  const handleCreateBoard = (templateId: string) => {
    const template = templates[templateId];
    if (!template) return;

    const wbId = createWhiteboard(template.name);

    // Process template cards
    const createdCardIds = template.cards.map((c) => addCard(c));
    const layout = template.layout(createdCardIds);

    // Place instances
    layout.instances.forEach((inst) => {
      // Direct store mutation is discouraged, but placeCardOnWhiteboard generates a new instance ID.
      // We need to preserve the template's edge connections.
      // For this simplified setup, we'll use placeCard and let the user redraw edges,
      // OR we implement a robust batch initialization method in the store.
      // *Workaround*: Just place them using the store.
      useVisualKnowledgeStore
        .getState()
        .placeCardOnWhiteboard(wbId, inst.cardId, inst.position);
    });

    // We skip automatic edges for now due to instance ID mismatch.
    // In a full prod version, the store would accept `(cardId, position, forcedInstanceId)`

    setShowTemplateModal(false);
  };

  const createBlankBoard = () => {
    createWhiteboard("New Whiteboard");
    setShowTemplateModal(false);
  };

  // Ensure there is at least one whiteboard on mount
  useEffect(() => {
    if (Object.keys(whiteboards).length === 0) {
      createBlankBoard();
    }
  }, []);

  return (
    <div className="flex h-full w-full bg-[#F5F3ED] overflow-hidden">
      {/* Sidebar: Whiteboard List */}
      <div
        className="w-64 bg-white border-r border-[#8A9A8E]/20 flex flex-col z-10 shrink-0"
        data-tour="whiteboard-list"
      >
        <div className="p-4 border-b border-[#8A9A8E]/20 flex justify-between items-center bg-[#F9F9F9]">
          <h2 className="font-bold text-[#2C2C2C]">Whiteboards</h2>
          <div className="flex gap-1">
            <button
              onClick={resetOnboarding}
              className="p-1 hover:bg-[#E8E6E0] rounded text-[#8A9A8E] hover:text-[#4A7C59] transition-colors"
              title="Interactive Tour Guide"
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="p-1 hover:bg-[#E8E6E0] rounded text-[#4A7C59] transition-colors"
              data-testid="add-whiteboard-btn"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {Object.values(whiteboards).map((wb) => (
            <button
              key={wb.id}
              onClick={() => setActiveWhiteboard(wb.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group ${
                activeWhiteboardId === wb.id
                  ? "bg-[#4A7C59]/10 text-[#4A7C59] font-medium"
                  : "text-[#2C2C2C] hover:bg-[#F5F3ED]"
              }`}
            >
              <span className="truncate pr-2">{wb.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative flex flex-col" data-tour="canvas-area">
        {activeWhiteboardId ? (
          <ReactFlowProvider>
            {/* Toolbar Area */}
            <div className="absolute top-4 left-4 z-10 flex gap-4 bg-white/80 backdrop-blur-md p-2 rounded-xl shadow-md border border-[#8A9A8E]/20">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9A8E]"
                />
                <input
                  type="text"
                  placeholder="Search nodes by name..."
                  className="pl-9 pr-4 py-2 bg-transparent border border-[#8A9A8E]/30 rounded-lg text-sm focus:outline-none focus:border-[#4A7C59] w-64 text-[#2C2C2C]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 bg-transparent border border-[#8A9A8E]/30 rounded-lg text-sm focus:outline-none focus:border-[#4A7C59] text-[#2C2C2C] font-medium cursor-pointer"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="note">Notes</option>
                <option value="competitor">Competitors</option>
                <option value="insight">Insights</option>
                <option value="category">Categories</option>
                <option value="root">Root</option>
              </select>
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              fitView
              className="bg-[#F5F3ED]"
              minZoom={0.1}
              maxZoom={1.5}
            >
              <Background color="#8A9A8E" gap={24} size={2} />
              <Controls className="bg-white shadow-lg border border-[#8A9A8E]/20" />
              <MiniMap
                nodeStrokeColor={(n) => "#4A7C59"}
                nodeColor={(n) => "#fff"}
                maskColor="rgba(245, 243, 237, 0.7)"
                className="bg-white shadow-lg border border-[#8A9A8E]/20 rounded-lg overflow-hidden"
              />
            </ReactFlow>
          </ReactFlowProvider>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#8A9A8E]">
            <p>Select or create a whiteboard to start.</p>
          </div>
        )}
      </div>

      {/* AI Context Chat Panel */}
      {isChatOpen && activeWhiteboardId && (
        <MindmapAIChat
          activeWhiteboardId={activeWhiteboardId}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[#8A9A8E]/20 flex justify-between items-center bg-[#F9F9F9]">
              <div>
                <h2 className="text-xl font-bold text-[#2C2C2C]">
                  Create New Whiteboard
                </h2>
                <p className="text-sm text-[#8A9A8E]">
                  Choose a template or start fresh
                </p>
              </div>
              <button
                data-testid="close-template-modal-btn"
                onClick={() => setShowTemplateModal(false)}
                className="text-[#8A9A8E] hover:text-[#2C2C2C]"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-2 gap-4 bg-[#F5F3ED]">
              <div
                onClick={createBlankBoard}
                className="col-span-2 border-2 border-dashed border-[#8A9A8E]/40 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#4A7C59] hover:bg-[#4A7C59]/5 transition-all group"
              >
                <Plus
                  className="text-[#8A9A8E] group-hover:text-[#4A7C59] mb-2"
                  size={32}
                />
                <h3 className="font-bold text-[#2C2C2C]">Blank Canvas</h3>
                <p className="text-sm text-[#8A9A8E]">
                  Start from scratch with an empty whiteboard
                </p>
              </div>

              {Object.values(templates).map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleCreateBoard(t.id)}
                  className="bg-white border border-[#8A9A8E]/20 rounded-xl p-4 cursor-pointer hover:border-[#4A7C59] hover:shadow-lg transition-all flex flex-col h-32"
                >
                  <h3 className="font-bold text-[#2C2C2C] mb-1">{t.name}</h3>
                  <p className="text-xs text-[#8A9A8E] leading-relaxed line-clamp-2">
                    {t.description}
                  </p>
                  <div className="mt-auto flex gap-1 pt-3">
                    {t.cards.slice(0, 3).map((c, i) => (
                      <div
                        key={i}
                        className="h-6 w-12 bg-[#F5F3ED] rounded border border-[#8A9A8E]/30 text-[8px] flex items-center justify-center text-[#8A9A8E] truncate px-1"
                      >
                        {c.title}
                      </div>
                    ))}
                    {t.cards.length > 3 && (
                      <div className="h-6 w-6 bg-transparent flex items-center justify-center text-xs text-[#8A9A8E]">
                        +{t.cards.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Page Guide Modal */}
      <PageGuideModal
        isOpen={isModalActive}
        onClose={completeModal}
        activeTab="mindmap"
      />

      {/* Interactive Tour Guide */}
      <GuidedTour
        steps={getTourSteps()}
        isOpen={isTourActive}
        onClose={completeTour}
        onComplete={completeTour}
      />
    </div>
  );
}
