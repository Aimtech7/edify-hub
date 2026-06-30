import logging
from django.utils import timezone
from workflows.models import WorkflowDefinition, WorkflowInstance, AutomationRule
from workflows.engine.executor import WorkflowExecutor

logger = logging.getLogger(__name__)

class EventBus:
    @classmethod
    def emit_event(cls, event_name: str, payload: dict = None, initiator: str = "System"):
        """
        Emits an enterprise event across the Horizon platform.
        Triggers matching AutomationRules and WorkflowDefinitions.
        """
        if payload is None:
            payload = {}

        logger.info(f"[EventBus] Emitting event: '{event_name}' by '{initiator}' | Payload: {payload}")

        # 1. Evaluate Automation Rules (IF -> THEN)
        cls._evaluate_rules(event_name, payload, initiator)

        # 2. Trigger Event-Driven Workflows
        cls._trigger_workflows(event_name, payload, initiator)

    @classmethod
    def _evaluate_rules(cls, event_name: str, payload: dict, initiator: str):
        rules = AutomationRule.objects.filter(is_active=True, event_name__iexact=event_name)
        for rule in rules:
            try:
                passed = True
                for cond in rule.conditions:
                    field = cond.get("field")
                    op = cond.get("op", "==")
                    val = cond.get("val")
                    if field:
                        context_val = payload.get(field)
                        if not WorkflowExecutor._evaluate_condition(context_val, op, val):
                            passed = False
                            break
                if passed:
                    rule.execution_count += 1
                    rule.last_triggered_at = timezone.now()
                    rule.save()
                    logger.info(f"[RuleEngine] Triggered rule '{rule.name}' for event '{event_name}'")
            except Exception as e:
                logger.error(f"[RuleEngine] Error evaluating rule '{rule.name}': {e}")

    @classmethod
    def _trigger_workflows(cls, event_name: str, payload: dict, initiator: str):
        workflows = WorkflowDefinition.objects.filter(
            status=WorkflowDefinition.Status.ACTIVE,
            trigger_type=WorkflowDefinition.TriggerType.EVENT,
            trigger_event__iexact=event_name
        )
        for wf in workflows:
            try:
                instance = WorkflowInstance.objects.create(
                    workflow=wf,
                    trigger_data=payload,
                    execution_context=payload.copy(),
                    initiator=initiator
                )
                logger.info(f"[EventBus] Spawning workflow instance {instance.instance_id} for '{wf.name}'")
                WorkflowExecutor.execute_instance(instance)
            except Exception as e:
                logger.error(f"[EventBus] Error executing workflow '{wf.name}': {e}")
