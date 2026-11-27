#!/usr/bin/env python3
"""Validate JSON schemas and cross-document references for Headcount Planning specs."""
import json
import sys
from pathlib import Path

try:
    from jsonschema import Draft202012Validator
except ImportError:
    print("ERROR: missing dependency 'jsonschema'. Install: python -m pip install jsonschema")
    sys.exit(2)

ROOT = Path(__file__).resolve().parents[1]
errors = []

def load(rel):
    path = ROOT / rel
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"{rel}: cannot load JSON: {exc}")
        return {}

def validate_schema(data, schema_rel, data_rel):
    schema = load(schema_rel)
    if not schema:
        return
    validator = Draft202012Validator(schema)
    for err in validator.iter_errors(data):
        loc = ".".join(str(x) for x in err.absolute_path) or "<root>"
        errors.append(f"{data_rel}:{loc}: {err.message}")

def unique(items, label):
    seen = set()
    for item in items:
        key = item.get("id")
        if key in seen:
            errors.append(f"{label}: duplicate id '{key}'")
        seen.add(key)

project = load("specifications/project.json")
validate_schema(project, "schemas/project.schema.json", "specifications/project.json")
for rel, schema in [
    ("specifications/ui/pages.json", "schemas/ui-page.schema.json"),
    ("specifications/ui/transitions.json", "schemas/ui-transition.schema.json"),
    ("specifications/ui/actions.json", "schemas/ui-action.schema.json"),
    ("specifications/ui/components.json", "schemas/ui-component.schema.json"),
]:
    validate_schema(load(rel), schema, rel)

validate_schema(load("specifications/ui/ui-index.json"), "schemas/ui.schema.json", "specifications/ui/ui-index.json")

pages_doc = load("specifications/ui/pages.json")
trans_doc = load("specifications/ui/transitions.json")
actions_doc = load("specifications/ui/actions.json")
components_doc = load("specifications/ui/components.json")
api_doc = load("specifications/api/api-spec.json")

pages = pages_doc.get("pages", [])
transitions = trans_doc.get("transitions", [])
actions = actions_doc.get("actions", [])
components = components_doc.get("components", [])
apis = api_doc.get("apis", [])

for collection, label in [(pages,"pages"),(transitions,"transitions"),(actions,"actions"),(components,"components"),(apis,"apis")]:
    unique(collection, label)

module_ids = {x.get("id") for x in project.get("modules", [])}
for page in pages:
    if page.get("moduleId") not in module_ids:
        errors.append(f"page {page.get('id')}: unknown moduleId '{page.get('moduleId')}'")

page_by_id = {x.get("id"): x for x in pages}
action_by_id = {x.get("id"): x for x in actions}
transition_by_id = {x.get("id"): x for x in transitions}
component_ids = {x.get("id") for x in components}
api_by_id = {x.get("id"): x for x in apis}

# Page-level checks
for page in pages:
    pid, ptype = page.get("id"), page.get("pageType")
    if ptype == "PAGE" and not page.get("route"):
        errors.append(f"page {pid}: PAGE must define route")
    if ptype != "PAGE" and page.get("route"):
        errors.append(f"page {pid}: only PAGE may define route")
    if ptype == "DIALOG" and not page.get("dialog"):
        errors.append(f"page {pid}: DIALOG must define dialog settings")
    if ptype == "DRAWER" and not page.get("drawer"):
        errors.append(f"page {pid}: DRAWER must define drawer settings")
    for area in page.get("layout", {}).get("areas", []):
        for ref in area.get("componentRefs", []):
            if ref not in component_ids:
                errors.append(f"page {pid}: unknown componentRef '{ref}'")

# Transition checks
valid_modes = {
    "PAGE": {"SAME_TAB", "NEW_TAB"},
    "DIALOG": {"MODAL"},
    "DRAWER": {"DRAWER"},
    "INLINE_PANEL": {"INLINE"},
}
for tr in transitions:
    tid = tr.get("id")
    source, target = page_by_id.get(tr.get("from")), page_by_id.get(tr.get("to"))
    if not source:
        errors.append(f"transition {tid}: unknown from page '{tr.get('from')}'")
    if not target:
        errors.append(f"transition {tid}: unknown to page '{tr.get('to')}'")
    if target and tr.get("openMode") not in valid_modes.get(target.get("pageType"), set()):
        errors.append(f"transition {tid}: openMode '{tr.get('openMode')}' incompatible with target pageType '{target.get('pageType')}'")
    trigger = tr.get("trigger", {})
    if trigger.get("actionId") and trigger["actionId"] not in action_by_id:
        errors.append(f"transition {tid}: unknown trigger actionId '{trigger['actionId']}'")
    if tr.get("returnMapping") and target and target.get("pageType") not in {"DIALOG", "DRAWER"}:
        errors.append(f"transition {tid}: returnMapping is only supported for DIALOG/DRAWER targets")

# Action checks
for action in actions:
    aid, atype = action.get("id"), action.get("type")
    if atype == "API":
        api = api_by_id.get(action.get("apiId"))
        if not api:
            errors.append(f"action {aid}: unknown apiId '{action.get('apiId')}'")
        elif action.get("httpMethod") and action["httpMethod"] != api.get("method"):
            errors.append(f"action {aid}: httpMethod does not match API {action.get('apiId')}")
    if atype == "NAVIGATION":
        if action.get("transitionId") not in transition_by_id:
            errors.append(f"action {aid}: unknown transitionId '{action.get('transitionId')}'")
    success = action.get("success", {})
    if success.get("behavior") == "NAVIGATE" and success.get("targetPageId") not in page_by_id:
        errors.append(f"action {aid}: unknown success targetPageId '{success.get('targetPageId')}'")
    if success.get("behavior") == "REFRESH_COMPONENT" and success.get("targetComponentId") not in component_ids:
        errors.append(f"action {aid}: unknown targetComponentId '{success.get('targetComponentId')}'")

# Ensure every transition action trigger points to a NAVIGATION action whose transition points back to this transition.
for tr in transitions:
    aid = tr.get("trigger", {}).get("actionId")
    if aid and aid in action_by_id:
        action = action_by_id[aid]
        if action.get("type") == "NAVIGATION" and action.get("transitionId") != tr.get("id"):
            errors.append(f"transition {tr.get('id')}: trigger action '{aid}' points to a different transition")

# Validate the remaining V1.1 document families against their existing schemas.
for data_rel, schema_rel in [
    ("specifications/workflows/headcount-approval.json","schemas/workflow.schema.json"),
    ("specifications/data-model/entities.json","schemas/data-model.schema.json"),
    ("specifications/api/api-spec.json","schemas/api.schema.json"),
    ("specifications/integration/successfactors.json","schemas/integration.schema.json"),
]:
    validate_schema(load(data_rel), schema_rel, data_rel)
for path in sorted((ROOT/"specifications/modules").glob("*.json")):
    validate_schema(load(str(path.relative_to(ROOT))), "schemas/module.schema.json", str(path.relative_to(ROOT)))

if errors:
    print("SPEC VALIDATION FAILED")
    for err in errors:
        print(" -", err)
    sys.exit(1)

print("SPEC VALIDATION PASSED")
print(f"- Project modules: {len(project.get('modules', []))}")
print(f"- UI pages: {len(pages)}")
print(f"- UI transitions: {len(transitions)}")
print(f"- UI actions: {len(actions)}")
print(f"- UI components: {len(components)}")
print(f"- API definitions: {len(apis)}")
