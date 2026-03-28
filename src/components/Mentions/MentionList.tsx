import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  Building2,
  FileText,
  Lightbulb,
  Box,
  Hash,
} from "lucide-react";

interface MentionListProps {
  items: Record<string, { results: any[]; hasMore: boolean }>;
  command: (item: any) => void;
  query: string;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const { items, command, query } = props;
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<any[]>([]);
  const [loadingExpanded, setLoadingExpanded] = useState(false);

  // Flatten items for keyboard navigation in multi-category view
  /**
   *
   */
  const getFlatItems = () => {
    if (expandedCategory) {
      return expandedItems;
    }

    const flat: any[] = [];
    Object.entries(items).forEach(([category, data]) => {
      flat.push(...data.results);
      if (data.hasMore) {
        flat.push({ isShowMore: true, category });
      }
    });
    return flat;
  };

  const [selectedIndex, setSelectedIndex] = useState(0);
  const flatItems = getFlatItems();

  useEffect(() => {
    setSelectedIndex(0);
  }, [items, expandedCategory]);

  useEffect(() => {
    if (expandedCategory) {
      // Fetch expanded items
      setLoadingExpanded(true);
      const controller = new AbortController();
      fetch(
        `/api/search/mentions?q=${encodeURIComponent(query)}&limit_per_category=20`,
        {
          signal: controller.signal,
        },
      )
        .then((res) => res.json())
        .then((data) => {
          if (data[expandedCategory]) {
            setExpandedItems(data[expandedCategory].results);
          } else {
            setExpandedItems([]);
          }
          setLoadingExpanded(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error(err);
            setLoadingExpanded(false);
          }
        });
      return () => controller.abort();
    }
  }, [expandedCategory, query]);

  useImperativeHandle(ref, () => ({
    /**
     *
     */
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (selectedIndex + flatItems.length - 1) % flatItems.length,
        );
        return true;
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % flatItems.length);
        return true;
      }

      if (event.key === "Enter") {
        const item = flatItems[selectedIndex];
        if (item) {
          if (item.isShowMore) {
            setExpandedCategory(item.category);
          } else {
            command(item);
          }
        }
        return true;
      }

      if (event.key === "Backspace" && expandedCategory && query === "") {
        setExpandedCategory(null);
        return true;
      }

      return false;
    },
  }));

  /**
   *
   */
  const getIconForCategory = (category: string) => {
    switch (category) {
      case "competitor":
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case "raw_data":
        return <FileText className="w-4 h-4 text-green-500" />;
      case "insight":
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case "feature":
        return <Box className="w-4 h-4 text-purple-500" />;
      default:
        return <Hash className="w-4 h-4 text-gray-500" />;
    }
  };

  /**
   *
   */
  const formatCategoryName = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-ink-dark/10 overflow-hidden w-80 max-h-96 flex flex-col text-sm font-sans">
      <AnimatePresence mode="wait">
        {expandedCategory ? (
          <motion.div
            key="single-category"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col h-full overflow-hidden"
          >
            <div
              className="sticky top-0 bg-paper-light border-b border-ink-dark/10 px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-ink-dark/5"
              onMouseDown={(e) => {
                e.preventDefault();
                setExpandedCategory(null);
              }}
            >
              <ChevronLeft className="w-4 h-4 text-ink-dark/60" />
              <span className="font-semibold text-ink-dark">
                Back to all categories
              </span>
            </div>
            <div className="overflow-y-auto p-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-ink-dark/50 flex items-center gap-1.5">
                {getIconForCategory(expandedCategory)}
                {formatCategoryName(expandedCategory)}
              </div>
              {loadingExpanded ? (
                <div className="p-4 text-center text-ink-dark/50 text-xs">
                  Loading...
                </div>
              ) : (
                expandedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`px-3 py-2 rounded-lg cursor-pointer flex items-start flex-col gap-0.5 ${
                      index === selectedIndex
                        ? "bg-ink-dark/5"
                        : "hover:bg-ink-dark/5"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      command(item);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="font-medium text-ink-dark">
                      {item.title}
                    </span>
                    <span className="text-xs text-ink-dark/60 truncate w-full">
                      {item.excerpt}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="multi-category"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-y-auto p-1 h-full"
          >
            {Object.keys(items).length === 0 ? (
              <div className="p-4 text-center text-ink-dark/50 text-xs">
                No results found
              </div>
            ) : (
              Object.entries(items).map(([category, data], catIndex) => {
                const globalOffset = Object.entries(items)
                  .slice(0, catIndex)
                  .reduce(
                    (acc, [_, d]) =>
                      acc + d.results.length + (d.hasMore ? 1 : 0),
                    0,
                  );

                return (
                  <div key={category} className="mb-2 last:mb-0">
                    <div className="px-2 py-1.5 text-xs font-semibold text-ink-dark/50 flex items-center gap-1.5">
                      {getIconForCategory(category)}
                      {formatCategoryName(category)}
                    </div>
                    {data.results.map((item, i) => {
                      const idx = globalOffset + i;
                      return (
                        <div
                          key={item.id}
                          className={`px-3 py-2 rounded-lg cursor-pointer flex items-start flex-col gap-0.5 ${
                            idx === selectedIndex
                              ? "bg-ink-dark/5"
                              : "hover:bg-ink-dark/5"
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            command(item);
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <span className="font-medium text-ink-dark truncate w-full">
                            {item.title}
                          </span>
                          <span className="text-xs text-ink-dark/60 truncate w-full">
                            {item.excerpt}
                          </span>
                        </div>
                      );
                    })}
                    {data.hasMore && (
                      <div
                        className={`px-3 py-2 mt-1 rounded-lg cursor-pointer text-xs font-medium text-ochre flex items-center ${
                          globalOffset + data.results.length === selectedIndex
                            ? "bg-ochre/10"
                            : "hover:bg-ochre/10"
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setExpandedCategory(category);
                        }}
                        onMouseEnter={() =>
                          setSelectedIndex(globalOffset + data.results.length)
                        }
                      >
                        Show more {formatCategoryName(category)}...
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
