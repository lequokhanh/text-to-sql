# Import workflows from their specific modules
from core.workflows.sql_agent import SQLAgentWorkflow
from core.workflows.baseline_sql_agent import BaselineWorkflow
from core.workflows.schema_enrichment_agent import SchemaEnrichmentWorkflow

# Export workflow classes
__all__ = [
    'SQLAgentWorkflow',
    'BaselineWorkflow',
    'SchemaEnrichmentWorkflow'
]