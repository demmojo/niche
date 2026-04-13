import React from "react";
import { z } from "zod";

export interface ToolProps<T = any> {
  args: T;
  result?: any;
  status: "idle" | "running" | "success" | "error";
}

// Registry to hold tool definitions and their React components
const toolRegistry = new Map<
  string,
  {
    component: React.FC<ToolProps>;
    description: string;
    parameters: z.ZodType<any, any, any>;
  }
>();

export function registerTool<T>(
  name: string,
  description: string,
  parameters: z.ZodType<T, any, any>,
  component: React.FC<ToolProps<T>>,
) {
  if (toolRegistry.has(name)) {
    console.warn(`Tool ${name} is already registered. Overwriting.`);
  }
  toolRegistry.set(name, {
    component: component as React.FC<ToolProps>,
    description,
    parameters,
  });
}

export function getRegisteredTools() {
  const tools: Record<
    string,
    { description: string; parameters: z.ZodType<any, any, any> }
  > = {};
  toolRegistry.forEach((value, key) => {
    tools[key] = {
      description: value.description,
      parameters: value.parameters,
    };
  });
  return tools;
}

export function ToolRenderer({
  toolName,
  props,
}: {
  toolName: string;
  props: ToolProps;
}) {
  const tool = toolRegistry.get(toolName);
  if (!tool) {
    console.warn(`Attempted to render unregistered tool: ${toolName}`);
    return null;
  }
  const Component = tool.component;
  return <Component {...props} />;
}
