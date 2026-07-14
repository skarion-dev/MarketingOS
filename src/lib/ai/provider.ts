export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AiSendOptions {
  system?: string;
  messages: AiMessage[];
  tools?: AiTool[];
}

export interface AiSendResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface AiProvider {
  send(options: AiSendOptions): Promise<AiSendResult>;
}
