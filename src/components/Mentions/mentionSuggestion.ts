import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { MentionList } from "./MentionList";

// Debounce helper
let abortController: AbortController | null = null;
let debounceTimeout: NodeJS.Timeout | null = null;

export const createMentionSuggestion = (triggerChar: string): any => {
  return {
    char: triggerChar,

    items: async ({ query }: { query: string }) => {
      // Return default empty state if no query
      if (!query && triggerChar === "@") {
        return [
          {
            competitor: {
              results: [
                {
                  id: "1",
                  title: "Example Competitor",
                  type: "competitor",
                  excerpt: "Start typing to search...",
                },
              ],
              hasMore: false,
            },
          },
        ];
      }

      // Cancel previous request
      if (abortController) {
        abortController.abort();
      }

      // Clear timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      return new Promise<any[]>((resolve) => {
        debounceTimeout = setTimeout(async () => {
          abortController = new AbortController();

          try {
            const res = await fetch(
              `/api/search/mentions?q=${encodeURIComponent(query)}&limit_per_category=3`,
              {
                signal: abortController.signal,
              },
            );

            if (!res.ok) throw new Error("Search failed");

            const data = await res.json();
            resolve([data]);
          } catch (error: any) {
            if (error.name === "AbortError") {
              // Ignore aborted requests
              return;
            }
            console.error("Mention search error:", error);
            resolve([{}]);
          }
        }, 150); // 150ms debounce
      });
    },

    render: () => {
      let component: ReactRenderer;
      let popup: TippyInstance[];

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },

        onUpdate(props: any) {
          component.updateProps(props);

          if (!props.clientRect) {
            return;
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
        },

        onKeyDown(props: any) {
          if (props.event.key === "Escape") {
            popup[0].hide();
            return true;
          }

          // Let the MentionList component handle keyboard navigation
          return (component.ref as any)?.onKeyDown(props);
        },

        onExit() {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  };
};
