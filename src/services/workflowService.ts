import { apiClient } from "./api-client";

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  config?: Record<string, any>;
}

export interface WorkflowEdge {
  source: string;
  target: string;
  label?: string;
}

export interface WorkflowDefinition {
  id: number;
  name: string;
  description: string;
  category: string;
  trigger_type: "EVENT" | "SCHEDULED" | "MANUAL";
  trigger_event: string;
  trigger_cron: string;
  status: "ACTIVE" | "DRAFT" | "INACTIVE";
  definition_json: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  created_at: string;
  updated_at: string;
  instance_count: number;
}

export interface WorkflowActionLog {
  id: number;
  step_id: string;
  step_name: string;
  action_type: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "ROLLED_BACK";
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  duration_ms: number;
  executed_at: string;
  error_details?: string;
}

export interface ApprovalRequest {
  id: number;
  instance: number;
  workflow_name: string;
  step_id: string;
  title: string;
  description: string;
  target_role: string;
  target_user?: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requested_at: string;
  decided_at?: string;
  approver?: number;
  approver_username?: string;
  comments?: string;
}

export interface WorkflowInstance {
  id: number;
  instance_id: string;
  workflow: number;
  workflow_name: string;
  workflow_category: string;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "WAITING_APPROVAL" | "CANCELLED" | "ROLLED_BACK";
  trigger_data: Record<string, any>;
  execution_context: Record<string, any>;
  current_step_id: string;
  started_at: string;
  completed_at?: string;
  initiator: string;
  error_message?: string;
  logs: WorkflowActionLog[];
  approvals: ApprovalRequest[];
}

export interface AutomationRule {
  id: number;
  name: string;
  event_name: string;
  conditions: Array<{ field: string; op: string; val: any }>;
  actions: Array<{ type: string; target: string; channel?: string }>;
  is_active: boolean;
  execution_count: number;
  last_triggered_at?: string;
}

export interface ScheduledJob {
  id: number;
  name: string;
  task_type: string;
  cron_expression: string;
  description: string;
  is_active: boolean;
  last_run_at?: string;
  last_status: "IDLE" | "RUNNING" | "SUCCESS" | "FAILED";
  execution_log?: string;
}

export interface TelemetryData {
  kpi: {
    active_workflows: number;
    completed_workflows: number;
    failed_workflows: number;
    pending_approvals: number;
    rule_executions: number;
    active_scheduled_jobs: number;
  };
  recent_instances: WorkflowInstance[];
  ai_recommendations: Array<{
    title: string;
    detail: string;
    priority: "high" | "medium" | "low";
  }>;
}

export const workflowService = {
  getTelemetry: async (): Promise<TelemetryData> => {
    const { data } = await apiClient.get("/workflows/telemetry/");
    return data;
  },

  getDefinitions: async (): Promise<WorkflowDefinition[]> => {
    const { data } = await apiClient.get("/workflows/definitions/");
    return data;
  },

  createDefinition: async (definition: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> => {
    const { data } = await apiClient.post("/workflows/definitions/", definition);
    return data;
  },

  updateDefinition: async (id: number, definition: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> => {
    const { data } = await apiClient.patch(`/workflows/definitions/${id}/`, definition);
    return data;
  },

  spawnInstance: async (definitionId: number, payload: Record<string, any> = {}): Promise<WorkflowInstance> => {
    const { data } = await apiClient.post(`/workflows/definitions/${definitionId}/spawn/`, { payload });
    return data;
  },

  getInstances: async (): Promise<WorkflowInstance[]> => {
    const { data } = await apiClient.get("/workflows/instances/");
    return data;
  },

  retryInstance: async (id: number): Promise<WorkflowInstance> => {
    const { data } = await apiClient.post(`/workflows/instances/${id}/retry/`);
    return data;
  },

  rollbackInstance: async (id: number): Promise<WorkflowInstance> => {
    const { data } = await apiClient.post(`/workflows/instances/${id}/rollback/`);
    return data;
  },

  getApprovals: async (): Promise<ApprovalRequest[]> => {
    const { data } = await apiClient.get("/workflows/approvals/");
    return data;
  },

  decideApproval: async (id: number, decision: "APPROVED" | "REJECTED", comments: string = ""): Promise<ApprovalRequest> => {
    const { data } = await apiClient.post(`/workflows/approvals/${id}/decide/`, { decision, comments });
    return data;
  },

  getRules: async (): Promise<AutomationRule[]> => {
    const { data } = await apiClient.get("/workflows/rules/");
    return data;
  },

  createRule: async (rule: Partial<AutomationRule>): Promise<AutomationRule> => {
    const { data } = await apiClient.post("/workflows/rules/", rule);
    return data;
  },

  deleteRule: async (id: number): Promise<void> => {
    await apiClient.delete(`/workflows/rules/${id}/`);
  },

  getScheduledJobs: async (): Promise<ScheduledJob[]> => {
    const { data } = await apiClient.get("/workflows/scheduled-jobs/");
    return data;
  },

  runScheduledJob: async (id: number): Promise<any> => {
    const { data } = await apiClient.post(`/workflows/scheduled-jobs/${id}/run_now/`);
    return data;
  },

  runAllScheduledJobs: async (): Promise<any> => {
    const { data } = await apiClient.post("/workflows/scheduled-jobs/run_all/");
    return data;
  },

  emitEvent: async (eventName: string, payload: Record<string, any> = {}): Promise<any> => {
    const { data } = await apiClient.post("/workflows/events/emit/", { event_name: eventName, payload });
    return data;
  },
};
