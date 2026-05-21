export type ProductItem = {
  title: string;
  image: string;
  price: string;
  handle: string;
  description: string;
};

export type Booking = {
  summary: string;
  start: string;
  end: string;
  attendees?: string;
  description?: string;
  status: string;
  meet_url?: string;
};

export type CalendarEvent = {
  summary: string;
  start: string;
  end: string;
  status: string;
};

export type Task = {
  title: string;
  notes?: string;
};

export type Order = {
  id: string;
  name: string;
  total_price: string;
  created_at: string;
  status: string;
};

export type GenUIData = {
  message?: string;
  products?: ProductItem[];
  booking?: Booking;
  events?: CalendarEvent[];
  task?: Task;
  orders?: Order[];
};

export type Message = {
  id: string;
  role: "user" | "model" | "system" | "tool";
  text: string;
  toolName?: string;
  toolDone?: boolean;
  genUI?: GenUIData;
};

export interface ToolCall {
  type: string;
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  type: string;
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result: string;
}

export interface AgentStep {
  stepType: string;
  text: string;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
}

export interface WebhookResponse {
  output?: Record<string, unknown>;
  response?: string;
  text?: string;
  steps?: AgentStep[];
  intermediateSteps?: AgentStep[];
}

declare global {
  interface Window {
    MarnoChatConfig?: {
      webhookUrl?: string;
      kbSlug?: string;
      brandName?: string;
      brandLogo?: string;
      primaryColor?: string;
      toggleIcon?: string;
      fontFamily?: string;
      suggestions?: { label: string; prompt: string }[];
      greetings?: [string, string];
      storeUrl?: string;
      currencySymbol?: string;
      currencyLocale?: string;
      animationSpeed?: "fast" | "normal" | "off";
    };
    marno?: {
      open: () => void;
      close: () => void;
      toggle: () => void;
      send: (text: string) => void;
    };
  }
}
