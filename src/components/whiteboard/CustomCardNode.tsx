import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { useShallow } from "zustand/react/shallow";
import { useVisualKnowledgeStore } from "../../store/visualKnowledgeStore";
import { Tag, Plus, X } from "lucide-react";

interface CustomCardNodeProps {
  data: {
    instanceId: string;
    cardId: string;
    whiteboardId: string;
  };
}

export function CustomCardNode({ data }: CustomCardNodeProps) {
  const { cards, updateCard, deleteCard, removeCardFromWhiteboard } =
    useVisualKnowledgeStore(
      useShallow((state) => ({
        cards: state.cards,
        updateCard: state.updateCard,
        deleteCard: state.deleteCard,
        removeCardFromWhiteboard: state.removeCardFromWhiteboard,
      })),
    );
  const card = cards[data.cardId];

  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTag, setNewTag] = useState("");

  if (!card) return null;

  const getCardStyle = () => {
    switch (card.type) {
      case "root":
        return "bg-[#4A7C59] text-white font-bold border-[#4A7C59]";
      case "competitor":
        return "bg-white text-[#2C2C2C] font-semibold border-[#8A9A8E]";
      case "category":
        return "bg-[#F5F3ED] text-[#4A7C59] font-medium border-dashed border-[#4A7C59]";
      case "insight":
        return "bg-[#FFF9E6] text-[#8B5A2B] border-[#D9A05B]";
      default:
        return "bg-white text-[#2C2C2C] border-[#8A9A8E]";
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      const tag = newTag.trim().startsWith("#")
        ? newTag.trim()
        : `#${newTag.trim()}`;
      if (!card.tags.includes(tag)) {
        updateCard(card.id, { tags: [...card.tags, tag] });
      }
      setNewTag("");
      setIsEditingTags(false);
    } else if (e.key === "Escape") {
      setIsEditingTags(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateCard(card.id, { tags: card.tags.filter((t) => t !== tagToRemove) });
  };

  return (
    <div
      className={`relative flex flex-col w-[250px] p-3 rounded-xl border-2 shadow-md transition-all ${getCardStyle()}`}
      data-tour="card-tags"
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 border-2"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 border-2"
      />

      {/* Header */}
      <div className="flex justify-between items-start mb-2 group">
        <div className="text-xs uppercase tracking-wider opacity-70 font-bold">
          {card.type}
        </div>
        <button
          onClick={() =>
            removeCardFromWhiteboard(data.whiteboardId, data.instanceId)
          }
          className="opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
          data-testid="remove-node-btn"
        >
          <X size={14} />
        </button>
      </div>

      {/* Title & Content */}
      <h3 className="text-sm font-bold mb-1">{card.title}</h3>
      <div className="text-xs opacity-90 mb-3 whitespace-pre-wrap flex-1">
        {card.content}
      </div>

      {/* Tags Section */}
      <div className="mt-auto pt-2 border-t border-black/10">
        <div className="flex flex-wrap gap-1 items-center min-h-[24px]">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="group relative flex items-center px-1.5 py-0.5 bg-black/5 rounded text-[10px] font-medium"
            >
              {tag}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="hidden group-hover:flex absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                data-testid={`remove-tag-${tag}`}
              >
                <X size={8} />
              </button>
            </span>
          ))}

          {isEditingTags ? (
            <input
              autoFocus
              className="px-1 py-0.5 text-[10px] bg-white border border-[#4A7C59] rounded outline-none w-20 text-black"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleAddTag}
              onBlur={() => setIsEditingTags(false)}
              placeholder="#tag..."
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTags(true);
              }}
              className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-black/5 transition-colors text-black/50 hover:text-black/80"
              data-testid="add-tag-btn"
            >
              <Plus size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
