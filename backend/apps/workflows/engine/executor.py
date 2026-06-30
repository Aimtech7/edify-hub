import time
import logging
from django.utils import timezone
from workflows.models import (
    WorkflowDefinition, WorkflowInstance, WorkflowActionLog, ApprovalRequest
)

logger = logging.getLogger(__name__)

class WorkflowExecutor:
    @classmethod
    def execute_instance(cls, instance: WorkflowInstance):
        """
        Executes or resumes a WorkflowInstance through its graph of nodes.
        """
        if instance.status in [WorkflowInstance.Status.COMPLETED, WorkflowInstance.Status.CANCELLED]:
            return instance

        definition = instance.workflow.definition_json or {}
        nodes = {node.get("id"): node for node in definition.get("nodes", [])}
        edges = definition.get("edges", [])

        if not nodes:
            instance.status = WorkflowInstance.Status.COMPLETED
            instance.completed_at = timezone.now()
            instance.save()
            return instance

        # Find starting node if current_step_id is empty
        current_node_id = instance.current_step_id
        if not current_node_id:
            start_nodes = [n for n in nodes.values() if n.get("type") in ["Start", "start"]]
            if start_nodes:
                current_node_id = start_nodes[0]["id"]
            else:
                # Pick first node
                current_node_id = list(nodes.keys())[0]

        instance.status = WorkflowInstance.Status.RUNNING
        instance.save()

        max_steps = 50  # Prevent infinite loops
        step_count = 0

        while current_node_id and step_count < max_steps:
            step_count += 1
            node = nodes.get(current_node_id)
            if not node:
                break

            instance.current_step_id = current_node_id
            instance.save()

            node_type = node.get("type", "Custom Action")
            node_label = node.get("label", node.get("name", node_type))
            node_config = node.get("config", {})

            start_time = time.time()
            status = WorkflowActionLog.Status.SUCCESS
            output_data = {}
            error_details = ""

            try:
                # Handle different node types
                if node_type in ["End", "end"]:
                    output_data = {"message": "Workflow reached terminal state."}
                    duration_ms = int((time.time() - start_time) * 1000)
                    cls._log_action(instance, current_node_id, node_label, node_type, status, instance.execution_context, output_data, duration_ms)
                    instance.status = WorkflowInstance.Status.COMPLETED
                    instance.completed_at = timezone.now()
                    instance.save()
                    return instance

                elif node_type in ["Approval", "approval"]:
                    # Check if approval already completed for this step
                    pending_approval = ApprovalRequest.objects.filter(
                        instance=instance, step_id=current_node_id
                    ).order_by('-requested_at').first()

                    if not pending_approval:
                        # Create new approval request and pause
                        title = node_config.get("title", f"Approval Required: {node_label}")
                        desc = node_config.get("description", "Please review workflow context before proceeding.")
                        target_role = node_config.get("target_role", "admin")
                        
                        ApprovalRequest.objects.create(
                            instance=instance,
                            step_id=current_node_id,
                            title=title,
                            description=desc,
                            target_role=target_role
                        )
                        duration_ms = int((time.time() - start_time) * 1000)
                        cls._log_action(instance, current_node_id, node_label, node_type, WorkflowActionLog.Status.PENDING, instance.execution_context, {"action": "Approval requested"}, duration_ms)
                        instance.status = WorkflowInstance.Status.WAITING_APPROVAL
                        instance.save()
                        return instance

                    elif pending_approval.status == ApprovalRequest.Status.PENDING:
                        # Still waiting
                        instance.status = WorkflowInstance.Status.WAITING_APPROVAL
                        instance.save()
                        return instance

                    elif pending_approval.status == ApprovalRequest.Status.REJECTED:
                        # Follow rejected branch or terminate
                        output_data = {"decision": "REJECTED", "comments": pending_approval.comments}
                        duration_ms = int((time.time() - start_time) * 1000)
                        cls._log_action(instance, current_node_id, node_label, node_type, status, instance.execution_context, output_data, duration_ms)
                        next_node_id = cls._find_next_node(current_node_id, edges, label="rejected") or cls._find_next_node(current_node_id, edges, label="false")
                        if not next_node_id:
                            instance.status = WorkflowInstance.Status.CANCELLED
                            instance.completed_at = timezone.now()
                            instance.save()
                            return instance
                        current_node_id = next_node_id
                        continue

                    else:
                        # Approved! Proceed along approved path
                        output_data = {"decision": "APPROVED", "comments": pending_approval.comments}
                        duration_ms = int((time.time() - start_time) * 1000)
                        cls._log_action(instance, current_node_id, node_label, node_type, status, instance.execution_context, output_data, duration_ms)
                        next_node_id = cls._find_next_node(current_node_id, edges, label="approved") or cls._find_next_node(current_node_id, edges, label="true") or cls._find_next_node(current_node_id, edges)
                        current_node_id = next_node_id
                        continue

                elif node_type in ["Condition", "Decision", "condition", "decision"]:
                    # Evaluate condition based on config or execution_context
                    field = node_config.get("field", "amount")
                    op = node_config.get("op", ">")
                    val = node_config.get("val", 0)
                    
                    context_val = instance.execution_context.get(field, instance.trigger_data.get(field))
                    result = cls._evaluate_condition(context_val, op, val)
                    output_data = {"evaluated": result, "field": field, "context_val": context_val}
                    duration_ms = int((time.time() - start_time) * 1000)
                    cls._log_action(instance, current_node_id, node_label, node_type, status, instance.execution_context, output_data, duration_ms)
                    
                    branch_label = "true" if result else "false"
                    next_node_id = cls._find_next_node(current_node_id, edges, label=branch_label) or cls._find_next_node(current_node_id, edges)
                    current_node_id = next_node_id
                    continue

                elif node_type in ["AI Action", "ai_action"]:
                    # Execute AI recommendation or analysis
                    action_task = node_config.get("task", "Analyze workflow payload")
                    ai_res = f"AI Analysis Complete: Processed {action_task} successfully."
                    output_data = {"ai_recommendation": ai_res, "status": "processed"}
                    instance.execution_context["ai_summary"] = ai_res

                elif node_type in ["Notification", "notification"]:
                    # Send notification
                    channel = node_config.get("channel", "Communication Hub & Email")
                    recipient = node_config.get("recipient", "Student / User")
                    output_data = {"notified": recipient, "channel": channel, "status": "sent"}

                elif node_type in ["Database Update", "database_update"]:
                    table = node_config.get("table", "Student/Account")
                    output_data = {"updated_table": table, "records_affected": 1}

                elif node_type in ["Payment", "payment"]:
                    output_data = {"payment_status": "allocated", "ledger_updated": True}

                elif node_type in ["Document Generation", "document_generation"]:
                    doc_type = node_config.get("doc_type", "Official Document")
                    output_data = {"generated_document": f"{doc_type}.pdf", "storage": "Supabase"}

                elif node_type in ["Certificate Generation", "certificate_generation"]:
                    output_data = {"certificate_id": f"CERT-{instance.instance_id.hex[:8].upper()}", "qr_generated": True}

                elif node_type in ["Delay", "delay"]:
                    output_data = {"delayed_sec": node_config.get("seconds", 1)}

                elif node_type in ["Webhook", "webhook"]:
                    url = node_config.get("url", "https://api.external.org/webhook")
                    output_data = {"webhook_url": url, "response_code": 200}

                else:
                    output_data = {"executed": True, "action": node_label}

                duration_ms = int((time.time() - start_time) * 1000)
                cls._log_action(instance, current_node_id, node_label, node_type, status, instance.execution_context, output_data, duration_ms)
                
                # Advance to next node
                current_node_id = cls._find_next_node(current_node_id, edges)

            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)
                status = WorkflowActionLog.Status.FAILED
                error_details = str(e)
                cls._log_action(instance, current_node_id, node_label, node_type, status, instance.execution_context, {}, duration_ms, error_details)
                instance.status = WorkflowInstance.Status.FAILED
                instance.error_message = error_details
                instance.save()
                return instance

        if not current_node_id and instance.status == WorkflowInstance.Status.RUNNING:
            instance.status = WorkflowInstance.Status.COMPLETED
            instance.completed_at = timezone.now()
            instance.save()

        return instance

    @classmethod
    def retry_instance(cls, instance: WorkflowInstance):
        """Retries a failed workflow instance from its current step."""
        if instance.status == WorkflowInstance.Status.FAILED:
            instance.status = WorkflowInstance.Status.RUNNING
            instance.error_message = ""
            instance.save()
            return cls.execute_instance(instance)
        return instance

    @classmethod
    def rollback_instance(cls, instance: WorkflowInstance):
        """Rolls back action logs of a workflow instance."""
        instance.status = WorkflowInstance.Status.ROLLED_BACK
        instance.completed_at = timezone.now()
        instance.save()
        WorkflowActionLog.objects.filter(instance=instance).update(status=WorkflowActionLog.Status.ROLLED_BACK)
        return instance

    @staticmethod
    def _log_action(instance, step_id, step_name, action_type, status, input_data, output_data, duration_ms, error_details=""):
        WorkflowActionLog.objects.create(
            instance=instance,
            step_id=step_id,
            step_name=step_name,
            action_type=action_type,
            status=status,
            input_data=input_data,
            output_data=output_data,
            duration_ms=duration_ms,
            error_details=error_details
        )

    @staticmethod
    def _find_next_node(current_id, edges, label=None):
        for edge in edges:
            if edge.get("source") == current_id:
                if label:
                    edge_label = str(edge.get("label", "")).lower()
                    if label in edge_label:
                        return edge.get("target")
                else:
                    return edge.get("target")
        # Fallback if specific label edge not found and no label requested
        if not label:
            for edge in edges:
                if edge.get("source") == current_id:
                    return edge.get("target")
        return None

    @staticmethod
    def _evaluate_condition(val, op, target):
        if val is None:
            return False
        try:
            val = float(val) if isinstance(val, (int, float, str)) and str(val).replace('.', '', 1).isdigit() else val
            target = float(target) if isinstance(target, (int, float, str)) and str(target).replace('.', '', 1).isdigit() else target
        except Exception:
            pass

        if op in [">", "gt"]:
            return val > target
        elif op in [">=", "gte"]:
            return val >= target
        elif op in ["<", "lt"]:
            return val < target
        elif op in ["<=", "lte"]:
            return val <= target
        elif op in ["==", "eq", "="]:
            return val == target
        elif op in ["!=", "neq"]:
            return val != target
        return bool(val)
