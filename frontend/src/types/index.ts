export interface Project {
  id: string;
  name: string;
  path: string;
  session_count: number;
  last_activity: string | null;
}

export interface Session {
  id: string;
  project_id: string;
  filename: string;
  size: number;
  size_human: string;
  updated_at: string;
  is_agent: boolean;
}

export interface SessionMetadata {
  session_id: string;
  size: number;
  size_human: string;
  updated_at: string;
  summary: string | null;
  first_message: string | null;
  message_count: number;
  user_message_count: number;
  tool_calls: Record<string, number>;
  has_agents: boolean;
  agent_count: number;
  leaf_uuid: string | null;
}

export interface SearchResult {
  session_id: string;
  project_id: string;
  project_path: string;
  summary: string | null;
  first_message: string | null;
  message_count: number;
  size_human: string;
  updated_at: string;
  has_agents: boolean;
  agent_count: number;
  tool_calls: Record<string, number>;
}

export interface ToolCallItem {
  type: 'tool';
  name: string;
  input: Record<string, unknown>;
  formatted: string;
  result?: ToolResultData;
}

export interface ToolResultData {
  content: string;
  is_error?: boolean;
}

export interface ToolResultItem {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface TextItem {
  type: 'text';
  content: string;
}

export type MessageItem = ToolCallItem | TextItem | ToolResultItem;

export interface Message {
  type: 'user' | 'assistant' | 'summary';
  content?: string;
  items?: MessageItem[];
  timestamp: string;
}

export interface AgentLog {
  agent_id: string;
  messages: Message[];
  size_human: string;
  updated_at: string;
}

// Usage Types
export interface ModelUsage {
  model: string;
  total_cost: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  session_count: number;
}

export interface DailyUsage {
  date: string;
  total_cost: number;
  total_tokens: number;
  models_used: string[];
}

export interface ProjectUsage {
  project_path: string;
  project_name: string;
  total_cost: number;
  total_tokens: number;
  session_count: number;
  last_used: string;
}

export interface UsageStats {
  total_cost: number;
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cache_creation_tokens: number;
  total_cache_read_tokens: number;
  total_sessions: number;
  by_model: ModelUsage[];
  by_date: DailyUsage[];
  by_project: ProjectUsage[];
}

// Analysis Types
export interface SelectedSession {
  sessionId: string;
  projectId: string;
  projectName: string;
  updatedAt: string;
  sizeHuman: string;
}

export interface AnalysisRequest {
  project_id?: string;  // optional - 여러 프로젝트 세션 선택 시
  session_ids: string[];
  model?: string;  // Claude 모델 선택
}

export interface Analysis {
  id: string;
  project_id: string | null;
  project_name: string;
  session_ids: string[];
  prompt_count: number;
  result: string;
  model?: string;  // 사용된 Claude 모델
  created_at: string;
  updated_at: string | null;
}

export interface AnalysisListItem {
  id: string;
  project_id: string | null;
  project_name: string;
  session_count: number;
  prompt_count: number;
  created_at: string;
  summary: string;
}

// Work Analysis Types
export interface WorkAnalysis {
  id: string;
  date_from: string;
  date_to: string;
  project_ids: string[];
  project_names: string[];
  session_ids: string[];
  session_count: number;
  result: string;
  model?: string;  // 사용된 Claude 모델
  created_at: string;
  updated_at: string | null;
}

export interface WorkAnalysisListItem {
  id: string;
  date_from: string;
  date_to: string;
  project_names: string[];
  session_count: number;
  created_at: string;
  summary: string;
}

export interface WorkAnalysisRequest {
  date_from: string;
  date_to: string;
  project_ids?: string[];
  model?: string;  // Claude 모델 선택
}

// 사용 가능한 Claude 모델 목록
export const CLAUDE_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
] as const;

export type ClaudeModelId = typeof CLAUDE_MODELS[number]['id'];
export const DEFAULT_MODEL: ClaudeModelId = 'claude-sonnet-4-20250514';
