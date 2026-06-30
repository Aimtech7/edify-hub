import React, { useState, useEffect } from "react";
import {
  Activity, CheckCircle2, XCircle, AlertCircle, Clock, Play, RotateCcw, ShieldAlert,
  Layers, Plus, Search, FileText, Bot, Send, Calendar, RefreshCw, Check, X,
  ArrowRight, Settings, Sliders, Cpu
} from "lucide-react";
import {
  workflowService, TelemetryData, WorkflowDefinition, WorkflowInstance,
  ApprovalRequest, AutomationRule, ScheduledJob
} from "@/services/workflowService";

export default function AutomationEnginePage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "builder" | "rules" | "approvals" | "scheduler" | "logs">("dashboard");
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected item states
  const [selectedDefinition, setSelectedDefinition] = useState<WorkflowDefinition | null>(null);
  const [emitModalOpen, setEmitModalOpen] = useState(false);
  const [emitEventName, setEmitEventName] = useState("Payment Received");
  const [emitPayload, setEmitPayload] = useState('{"amount": 15000, "student_id": 1}');
  const [approvalComment, setApprovalComment] = useState<Record<number, string>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tData, defs, insts, apps, rls, jbs] = await Promise.all([
        workflowService.getTelemetry(),
        workflowService.getDefinitions(),
        workflowService.getInstances(),
        workflowService.getApprovals(),
        workflowService.getRules(),
        workflowService.getScheduledJobs()
      ]);
      setTelemetry(tData);
      setDefinitions(defs);
      if (defs.length > 0 && !selectedDefinition) {
        setSelectedDefinition(defs[0]);
      }
      setInstances(insts);
      setApprovals(apps);
      setRules(rls);
      setJobs(jbs);
    } catch (err) {
      console.error("Failed to load automation data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleSpawn = async (defId: number) => {
    try {
      await workflowService.spawnInstance(defId, { manual_trigger: true, timestamp: new Date().toISOString() });
      showFeedback("Successfully spawned workflow execution!");
      fetchData();
    } catch (err) {
      showFeedback("Failed to spawn workflow.");
    }
  };

  const handleDecideApproval = async (id: number, decision: "APPROVED" | "REJECTED") => {
    try {
      const comment = approvalComment[id] || `${decision} via Automation Center`;
      await workflowService.decideApproval(id, decision, comment);
      showFeedback(`Approval request ${decision.toLowerCase()}!`);
      fetchData();
    } catch (err) {
      showFeedback("Error processing approval.");
    }
  };

  const handleRunJob = async (id: number) => {
    try {
      const res = await workflowService.runScheduledJob(id);
      showFeedback(`Job executed: ${res.status}`);
      fetchData();
    } catch (err) {
      showFeedback("Error running scheduled job.");
    }
  };

  const handleEmitEvent = async () => {
    try {
      const parsedPayload = JSON.parse(emitPayload);
      await workflowService.emitEvent(emitEventName, parsedPayload);
      setEmitModalOpen(false);
      showFeedback(`Event '${emitEventName}' dispatched across Event Bus!`);
      fetchData();
    } catch (err) {
      alert("Invalid JSON payload or API error.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/30">
        <div>
          <div className="flex items-center space-x-3">
            <Cpu className="w-8 h-8 text-indigo-400 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Workflow & Automation Engine</h1>
          </div>
          <p className="text-indigo-200 mt-1 text-sm">
            Event-driven orchestration across Admissions, Finance ERP, Academics, ODEL Lessons, Exams, and Certificates.
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={() => setEmitModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition"
          >
            <Send className="w-4 h-4" />
            <span>Emit Test Event</span>
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: "dashboard", label: "Dashboard & Telemetry", icon: Activity },
          { id: "builder", label: "Visual Workflow Builder", icon: Layers },
          { id: "rules", label: "Rule Engine (IF → THEN)", icon: Sliders },
          { id: "approvals", label: `Approval Queue (${approvals.filter(a => a.status === 'PENDING').length})`, icon: ShieldAlert },
          { id: "scheduler", label: "Scheduler & Cron", icon: Calendar },
          { id: "logs", label: "Audit & Recovery Logs", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition shrink-0 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && !telemetry ? (
        <div className="text-center py-12 text-slate-400">Loading Automation Engine Telemetry...</div>
      ) : (
        <>
          {/* TAB 1: DASHBOARD & TELEMETRY */}
          {activeTab === "dashboard" && telemetry && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-semibold uppercase">Active Workflows</div>
                  <div className="text-2xl font-bold text-indigo-400 mt-1">{telemetry.kpi.active_workflows}</div>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-semibold uppercase">Completed</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{telemetry.kpi.completed_workflows}</div>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-semibold uppercase">Failed / Alert</div>
                  <div className="text-2xl font-bold text-rose-400 mt-1">{telemetry.kpi.failed_workflows}</div>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-semibold uppercase">Pending Approvals</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">{telemetry.kpi.pending_approvals}</div>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-semibold uppercase">Rule Executions</div>
                  <div className="text-2xl font-bold text-cyan-400 mt-1">{telemetry.kpi.rule_executions}</div>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-semibold uppercase">Active Cron Jobs</div>
                  <div className="text-2xl font-bold text-purple-400 mt-1">{telemetry.kpi.active_scheduled_jobs}</div>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-4">
                  <Bot className="w-5 h-5" />
                  <span>Horizon AI Workflow Optimization Recommendations</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {telemetry.ai_recommendations.map((rec, i) => (
                    <div key={i} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                          rec.priority === "high" ? "bg-rose-500/20 text-rose-300" :
                          rec.priority === "medium" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                        }`}>{rec.priority} Priority</span>
                      </div>
                      <h4 className="font-semibold text-slate-200 text-sm">{rec.title}</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">{rec.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Executions Summary */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6">
                <h3 className="font-bold text-slate-200 mb-4">Recent Workflow Instances</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Instance ID</th>
                        <th className="py-3 px-4">Workflow Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Initiator</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Started At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {telemetry.recent_instances.length === 0 ? (
                        <tr><td colSpan={6} className="py-6 text-center text-slate-500">No workflow instances executed yet.</td></tr>
                      ) : (
                        telemetry.recent_instances.map((inst) => (
                          <tr key={inst.id} className="hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-mono text-xs text-indigo-400">{inst.instance_id.slice(0, 8)}...</td>
                            <td className="py-3 px-4 font-semibold text-slate-200">{inst.workflow_name}</td>
                            <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">{inst.workflow_category}</span></td>
                            <td className="py-3 px-4 text-xs">{inst.initiator}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                inst.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300" :
                                inst.status === "FAILED" ? "bg-rose-500/20 text-rose-300" :
                                inst.status === "WAITING_APPROVAL" ? "bg-amber-500/20 text-amber-300" : "bg-indigo-500/20 text-indigo-300"
                              }`}>{inst.status}</span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-400">{new Date(inst.started_at).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL WORKFLOW BUILDER */}
          {activeTab === "builder" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Workflow Definitions List */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="font-bold text-slate-200">Pre-built Enterprise Workflows</h3>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">{definitions.length} Live</span>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {definitions.map((def) => (
                    <div
                      key={def.id}
                      onClick={() => setSelectedDefinition(def)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        selectedDefinition?.id === def.id
                          ? "bg-indigo-950/60 border-indigo-500"
                          : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 text-sm">{def.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">{def.category}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{def.description}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-xs">
                        <span className="text-indigo-400 font-medium">Trigger: {def.trigger_event || def.trigger_type}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSpawn(def.id); }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium flex items-center space-x-1 shadow"
                        >
                          <Play className="w-3 h-3" />
                          <span>Simulate</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Visual Node Graph Designer */}
              <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
                {selectedDefinition ? (
                  <div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800">
                      <div>
                        <h2 className="text-lg font-bold text-white">{selectedDefinition.name}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{selectedDefinition.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 mt-2 md:mt-0">
                        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold">Active Status</span>
                        <button
                          onClick={() => handleSpawn(selectedDefinition.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Run Instant Test</span>
                        </button>
                      </div>
                    </div>

                    {/* Node Chain Visual Flow */}
                    <div className="mt-6 space-y-4 max-h-[520px] overflow-y-auto pr-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Visual Node Execution Chain</div>
                      {selectedDefinition.definition_json?.nodes?.map((node, idx) => {
                        const isStart = node.type === "Start";
                        const isEnd = node.type === "End";
                        const isApproval = node.type === "Approval";
                        const isAI = node.type === "AI Action";
                        const isDoc = node.type === "Document Generation" || node.type === "Certificate Generation";
                        return (
                          <div key={node.id} className="relative flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-lg ${
                              isStart ? "bg-emerald-600 text-white" :
                              isEnd ? "bg-rose-600 text-white" :
                              isApproval ? "bg-amber-600 text-white" :
                              isAI ? "bg-purple-600 text-white" :
                              isDoc ? "bg-cyan-600 text-white" : "bg-indigo-600 text-white"
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300">{node.type}</span>
                                  <span className="font-semibold text-slate-200 text-sm">{node.label}</span>
                                </div>
                                {node.config && Object.keys(node.config).length > 0 && (
                                  <div className="text-xs text-slate-400 mt-1 font-mono">
                                    {JSON.stringify(node.config)}
                                  </div>
                                )}
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-600" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-500">Select a workflow definition from the list to view its node graph.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RULE ENGINE (IF → THEN) */}
          {activeTab === "rules" && (
            <div className="space-y-6">
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6">
                <h3 className="font-bold text-slate-200 mb-4">Configured Automation Rules (IF → THEN)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-sm">{rule.name}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold">Active</span>
                        </div>
                        <div className="mt-3 p-2.5 rounded-lg bg-slate-900/80 font-mono text-xs text-indigo-300 border border-slate-800">
                          IF Event == '{rule.event_name}'
                          {rule.conditions.length > 0 && (
                            <div className="text-slate-400 mt-1">
                              &amp;&amp; {rule.conditions.map(c => `${c.field} ${c.op} ${c.val}`).join(' && ')}
                            </div>
                          )}
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-semibold text-slate-400">THEN ACTIONS:</div>
                          {rule.actions.map((act, i) => (
                            <div key={i} className="text-xs text-slate-300 flex items-center space-x-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Execute: <strong className="text-white">{act.type}</strong> on {act.target}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>Executed: <strong className="text-slate-200">{rule.execution_count}</strong> times</span>
                        <span>{rule.last_triggered_at ? new Date(rule.last_triggered_at).toLocaleDateString() : "Never"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPROVAL QUEUE */}
          {activeTab === "approvals" && (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-slate-200">Multi-Level Workflow Approval Center</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Workflow Name</th>
                      <th className="py-3 px-4">Approval Title</th>
                      <th className="py-3 px-4">Target Role</th>
                      <th className="py-3 px-4">Requested At</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Decision / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {approvals.length === 0 ? (
                      <tr><td colSpan={6} className="py-6 text-center text-slate-500">No approval requests generated yet.</td></tr>
                    ) : (
                      approvals.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-semibold text-slate-200">{app.workflow_name}</td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">{app.title}</div>
                            <div className="text-xs text-slate-400">{app.description}</div>
                          </td>
                          <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-xs bg-indigo-950 text-indigo-300 font-mono uppercase">{app.target_role}</span></td>
                          <td className="py-3 px-4 text-xs text-slate-400">{new Date(app.requested_at).toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                              app.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-300" :
                              app.status === "REJECTED" ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                            }`}>{app.status}</span>
                          </td>
                          <td className="py-3 px-4">
                            {app.status === "PENDING" ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  placeholder="Decision notes..."
                                  value={approvalComment[app.id] || ""}
                                  onChange={(e) => setApprovalComment({ ...approvalComment, [app.id]: e.target.value })}
                                  className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-white w-36"
                                />
                                <button
                                  onClick={() => handleDecideApproval(app.id, "APPROVED")}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center space-x-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleDecideApproval(app.id, "REJECTED")}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold flex items-center space-x-1"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Decided by {app.approver_username || "Admin"}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SCHEDULER & CRON */}
          {activeTab === "scheduler" && (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-200">Scheduled Automation Jobs (Cron Scheduler)</h3>
                <button
                  onClick={async () => {
                    await workflowService.runAllScheduledJobs();
                    showFeedback("All scheduled jobs executed successfully!");
                    fetchData();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run All Due Jobs Now</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div key={job.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 text-sm">{job.name}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-purple-300">{job.cron_expression}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{job.description}</p>
                      {job.execution_log && (
                        <div className="mt-3 p-2.5 rounded bg-slate-900 text-xs font-mono text-slate-300 border border-slate-800 line-clamp-2">
                          {job.execution_log}
                        </div>
                      )}
                    </div>
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Last run: {job.last_run_at ? new Date(job.last_run_at).toLocaleString() : "Never"}</span>
                      <button
                        onClick={() => handleRunJob(job.id)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded font-semibold flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Trigger Job</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT LOGS & RECOVERY */}
          {activeTab === "logs" && (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-slate-200">Execution Telemetry & Error Recovery</h3>
              <div className="space-y-4">
                {instances.map((inst) => (
                  <div key={inst.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-slate-800 gap-2">
                      <div>
                        <span className="font-bold text-slate-200">{inst.workflow_name}</span>
                        <span className="ml-3 font-mono text-xs text-slate-400">ID: {inst.instance_id}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                          inst.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300" :
                          inst.status === "FAILED" ? "bg-rose-500/20 text-rose-300" : "bg-indigo-500/20 text-indigo-300"
                        }`}>{inst.status}</span>
                        {inst.status === "FAILED" && (
                          <button
                            onClick={async () => {
                              await workflowService.retryInstance(inst.id);
                              showFeedback("Retrying instance...");
                              fetchData();
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            await workflowService.rollbackInstance(inst.id);
                            showFeedback("Instance rolled back.");
                            fetchData();
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded text-xs font-semibold"
                        >
                          Rollback
                        </button>
                      </div>
                    </div>

                    {/* Step Logs */}
                    <div className="space-y-1.5 pl-2 border-l-2 border-slate-800">
                      {inst.logs?.map((log) => (
                        <div key={log.id} className="flex items-center justify-between text-xs text-slate-300 py-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-indigo-400">[{log.action_type}]</span>
                            <span className="font-semibold">{log.step_name}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-slate-400">
                            <span>{log.duration_ms}ms</span>
                            <span className={log.status === "SUCCESS" ? "text-emerald-400" : "text-rose-400 font-bold"}>{log.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Emit Event Modal */}
      {emitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-lg">Emit Test Event to Bus</h3>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Event Name</label>
              <select
                value={emitEventName}
                onChange={(e) => setEmitEventName(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
              >
                <option value="Payment Received">Payment Received</option>
                <option value="Student Applied">Student Applied</option>
                <option value="Course Enrolled">Course Enrolled</option>
                <option value="Lesson Uploaded">Lesson Uploaded</option>
                <option value="Exam Submitted">Exam Submitted</option>
                <option value="Certificate Generated">Certificate Generated</option>
                <option value="Broadcast Announcement">Broadcast Announcement</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">JSON Payload</label>
              <textarea
                rows={4}
                value={emitPayload}
                onChange={(e) => setEmitPayload(e.target.value)}
                className="mt-1 w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setEmitModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleEmitEvent}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow"
              >
                Dispatch Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
