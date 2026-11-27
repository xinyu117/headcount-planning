#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function load(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    errors.push(`${relativePath}: cannot load JSON: ${error.message}`);
    return {};
  }
}

function schemaTypeMatches(value, expected) {
  const types = Array.isArray(expected) ? expected : [expected];
  return types.some((type) => {
    switch (type) {
      case "object":
        return value !== null && typeof value === "object" && !Array.isArray(value);
      case "array":
        return Array.isArray(value);
      case "integer":
        return Number.isInteger(value);
      case "number":
        return typeof value === "number" && Number.isFinite(value);
      case "null":
        return value === null;
      case "string":
      case "boolean":
        return typeof value === type;
      default:
        return true;
    }
  });
}

function validateSchema(schema, value, location, output) {
  if (!schema || typeof schema !== "object") return;

  if (schema.type && !schemaTypeMatches(value, schema.type)) {
    output.push(`${location}: must be ${Array.isArray(schema.type) ? schema.type.join(" or ") : schema.type}`);
    return;
  }
  if (Object.hasOwn(schema, "const") && !isDeepEqual(value, schema.const)) {
    output.push(`${location}: must equal ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.some((item) => isDeepEqual(value, item))) {
    output.push(`${location}: must be one of ${JSON.stringify(schema.enum)}`);
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) {
      output.push(`${location}: must contain at least ${schema.minLength} characters`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      output.push(`${location}: does not match pattern ${schema.pattern}`);
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      output.push(`${location}: must contain at least ${schema.minItems} items`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      output.push(`${location}: must contain at most ${schema.maxItems} items`);
    }
    if (schema.uniqueItems && new Set(value.map(stableStringify)).size !== value.length) {
      output.push(`${location}: items must be unique`);
    }
    if (schema.items) {
      value.forEach((item, index) => validateSchema(schema.items, item, `${location}.${index}`, output));
    }
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const requiredKey of schema.required ?? []) {
      if (!Object.hasOwn(value, requiredKey)) {
        output.push(`${location}: missing required property '${requiredKey}'`);
      }
    }
    for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) {
        validateSchema(propertySchema, value[key], `${location}.${key}`, output);
      }
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(schema.properties ?? {}, key)) {
          output.push(`${location}: unexpected property '${key}'`);
        }
      }
    } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
      for (const [key, item] of Object.entries(value)) {
        if (!Object.hasOwn(schema.properties ?? {}, key)) {
          validateSchema(schema.additionalProperties, item, `${location}.${key}`, output);
        }
      }
    }
  }

  for (const subschema of schema.allOf ?? []) {
    validateSchema(subschema, value, location, output);
  }
  if (schema.if) {
    const conditionErrors = [];
    validateSchema(schema.if, value, location, conditionErrors);
    const branch = conditionErrors.length === 0 ? schema.then : schema.else;
    if (branch) validateSchema(branch, value, location, output);
  }
}

function isDeepEqual(left, right) {
  if (left instanceof Set && right instanceof Set) {
    return left.size === right.size && [...left].every((item) => right.has(item));
  }
  return stableStringify(left) === stableStringify(right);
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function validateAgainstSchema(data, schemaPath, dataPath) {
  const schema = load(schemaPath);
  if (Object.keys(schema).length === 0) return;
  validateSchema(schema, data, dataPath, errors);
}

function unique(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) errors.push(`${label}: duplicate id '${item.id}'`);
    seen.add(item.id);
  }
}

function isValidMappingExpression(expression) {
  return typeof expression === "string"
    && (/^'(?:[^'\\]|\\.)*'$/.test(expression)
      || /^(route|event|form|response)(\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(expression));
}

function pageComponentIds(page) {
  return new Set((page.layout?.areas ?? []).flatMap((area) => area.componentRefs ?? []));
}

function validateSpecifications() {
  const project = load("specifications/project.json");
  validateAgainstSchema(project, "schemas/project.schema.json", "specifications/project.json");
  for (const [relativePath, schemaPath] of [
    ["specifications/ui/pages.json", "schemas/ui-page.schema.json"],
    ["specifications/ui/transitions.json", "schemas/ui-transition.schema.json"],
    ["specifications/ui/actions.json", "schemas/ui-action.schema.json"],
    ["specifications/ui/components.json", "schemas/ui-component.schema.json"],
  ]) {
    validateAgainstSchema(load(relativePath), schemaPath, relativePath);
  }
  validateAgainstSchema(
    load("specifications/ui/ui-index.json"),
    "schemas/ui.schema.json",
    "specifications/ui/ui-index.json",
  );

  const pages = load("specifications/ui/pages.json").pages ?? [];
  const transitions = load("specifications/ui/transitions.json").transitions ?? [];
  const actions = load("specifications/ui/actions.json").actions ?? [];
  const components = load("specifications/ui/components.json").components ?? [];
  const apis = load("specifications/api/api-spec.json").apis ?? [];
  for (const [collection, label] of [
    [pages, "pages"],
    [transitions, "transitions"],
    [actions, "actions"],
    [components, "components"],
    [apis, "apis"],
  ]) unique(collection, label);

  const moduleIds = new Set((project.modules ?? []).map((item) => item.id));
  const pageById = new Map(pages.map((item) => [item.id, item]));
  const actionById = new Map(actions.map((item) => [item.id, item]));
  const transitionById = new Map(transitions.map((item) => [item.id, item]));
  const componentById = new Map(components.map((item) => [item.id, item]));
  const apiById = new Map(apis.map((item) => [item.id, item]));
  const componentIds = new Set(components.map((item) => item.id));

  for (const page of pages) {
    const pageId = page.id;
    if (!moduleIds.has(page.moduleId)) errors.push(`page ${pageId}: unknown moduleId '${page.moduleId}'`);
    if (page.pageType === "PAGE" && !page.route) errors.push(`page ${pageId}: PAGE must define route`);
    if (page.pageType !== "PAGE" && page.route) errors.push(`page ${pageId}: only PAGE may define route`);
    if (page.pageType === "DIALOG" && !page.dialog) errors.push(`page ${pageId}: DIALOG must define dialog settings`);
    if (page.pageType === "DRAWER" && !page.drawer) errors.push(`page ${pageId}: DRAWER must define drawer settings`);
    if (page.pageType === "PAGE") {
      const routeParams = new Set([...page.route.matchAll(/:([A-Za-z][A-Za-z0-9_]*)\??/g)].map((match) => match[1]));
      const declaredParams = new Set((page.parameters ?? [])
        .filter((parameter) => parameter.source === "route")
        .map((parameter) => parameter.name));
      if (!isDeepEqual(routeParams, declaredParams)) {
        errors.push(`page ${pageId}: route parameters do not match declared route parameters`);
      }
    }
    const pageComponents = pageComponentIds(page);
    for (const componentId of pageComponents) {
      if (!componentIds.has(componentId)) errors.push(`page ${pageId}: unknown componentRef '${componentId}'`);
    }
    for (const binding of page.componentBindings ?? []) {
      const sourceComponent = componentById.get(binding.sourceComponentId);
      const targetComponent = componentById.get(binding.targetComponentId);
      if (!pageComponents.has(binding.sourceComponentId)) errors.push(`page ${pageId}: component binding source is not used by the page`);
      if (!pageComponents.has(binding.targetComponentId)) errors.push(`page ${pageId}: component binding target is not used by the page`);
      if (sourceComponent && !sourceComponent.events.includes(binding.event)) {
        errors.push(`page ${pageId}: component binding references undeclared event '${binding.event}'`);
      }
      if (sourceComponent && binding.value === "event" && !sourceComponent.eventPayloads?.[binding.event]?.length) {
        errors.push(`page ${pageId}: component binding event has no declared payload`);
      }
      if (targetComponent && !targetComponent.props.some((prop) => prop.name === binding.targetProp)) {
        errors.push(`page ${pageId}: component binding targets undeclared prop '${binding.targetProp}'`);
      }
      if (!isValidMappingExpression(binding.value)) {
        errors.push(`page ${pageId}: unsupported component binding expression '${binding.value}'`);
      }
    }
    for (const binding of page.parameterBindings ?? []) {
      const targetComponent = componentById.get(binding.targetComponentId);
      if (!(page.parameters ?? []).some((parameter) => parameter.name === binding.parameter)) {
        errors.push(`page ${pageId}: parameter binding references undeclared parameter '${binding.parameter}'`);
      }
      if (!pageComponents.has(binding.targetComponentId)) {
        errors.push(`page ${pageId}: parameter binding target is not used by the page`);
      }
      if (targetComponent && !targetComponent.props.some((prop) => prop.name === binding.targetProp)) {
        errors.push(`page ${pageId}: parameter binding targets undeclared prop '${binding.targetProp}'`);
      }
    }
    for (const actionId of page.loadActionIds ?? []) {
      if (!actionById.has(actionId)) errors.push(`page ${pageId}: unknown loadActionId '${actionId}'`);
    }
  }

  for (const component of components) {
    const eventNames = new Set(component.events ?? []);
    for (const eventName of Object.keys(component.eventPayloads ?? {})) {
      if (!eventNames.has(eventName)) {
        errors.push(`component ${component.id}: eventPayloads references undeclared event '${eventName}'`);
      }
    }
    for (const binding of component.actionBindings ?? []) {
      if (!eventNames.has(binding.event)) {
        errors.push(`component ${component.id}: action binding references undeclared event '${binding.event}'`);
      }
      if (!actionById.has(binding.actionId)) {
        errors.push(`component ${component.id}: action binding references unknown action '${binding.actionId}'`);
      }
    }
  }

  const validModes = {
    PAGE: new Set(["SAME_TAB", "NEW_TAB"]),
    DIALOG: new Set(["MODAL"]),
    DRAWER: new Set(["DRAWER"]),
    INLINE_PANEL: new Set(["INLINE"]),
  };
  for (const transition of transitions) {
    const id = transition.id;
    const source = pageById.get(transition.from);
    const target = pageById.get(transition.to);
    if (!source) errors.push(`transition ${id}: unknown from page '${transition.from}'`);
    if (!target) errors.push(`transition ${id}: unknown to page '${transition.to}'`);
    if (target && !validModes[target.pageType]?.has(transition.openMode)) {
      errors.push(`transition ${id}: openMode '${transition.openMode}' incompatible with target pageType '${target.pageType}'`);
    }

    const trigger = transition.trigger ?? {};
    if (trigger.type === "ACTION" && !trigger.actionId) errors.push(`transition ${id}: ACTION trigger must define actionId`);
    if (trigger.actionId && !actionById.has(trigger.actionId)) {
      errors.push(`transition ${id}: unknown trigger actionId '${trigger.actionId}'`);
    }
    if (trigger.type === "ACTION" && actionById.has(trigger.actionId)
      && actionById.get(trigger.actionId).type !== "NAVIGATION") {
      errors.push(`transition ${id}: ACTION trigger must reference a NAVIGATION action`);
    }

    let eventComponent;
    if (["ROW_CLICK", "BUTTON_CLICK", "MENU_ITEM", "LINK_CLICK", "CUSTOM_EVENT"].includes(trigger.type)) {
      const sourceComponent = componentById.get(trigger.source);
      if (!sourceComponent) {
        errors.push(`transition ${id}: unknown trigger source component '${trigger.source}'`);
      } else if (!sourceComponent.events.includes(trigger.event)) {
        errors.push(`transition ${id}: source component '${trigger.source}' has no event '${trigger.event}'`);
      } else if (source && sourceComponent.scope !== "GLOBAL" && !pageComponentIds(source).has(trigger.source)) {
        errors.push(`transition ${id}: trigger source component is not used by source page '${source.id}'`);
        eventComponent = sourceComponent;
      } else {
        eventComponent = sourceComponent;
      }
      if (sourceComponent && trigger.type === "ROW_CLICK"
        && (sourceComponent.category !== "DATA_TABLE" || trigger.event !== "row-click")) {
        errors.push(`transition ${id}: ROW_CLICK must use a DATA_TABLE row-click event`);
      }
      if (sourceComponent && trigger.type === "MENU_ITEM" && sourceComponent.category !== "MENU") {
        errors.push(`transition ${id}: MENU_ITEM source must be a MENU component`);
      }
    }

    let eventPaths = [];
    if (trigger.type === "ACTION") {
      for (const component of components) {
        const binding = (component.actionBindings ?? []).find((item) => item.actionId === trigger.actionId);
        if (binding) eventPaths.push(...(component.eventPayloads?.[binding.event] ?? []));
      }
    } else if (eventComponent) {
      eventPaths = eventComponent.eventPayloads?.[trigger.event] ?? [];
    }
    for (const [name, expression] of Object.entries(transition.parameterMapping ?? {})) {
      if (!isValidMappingExpression(expression)) errors.push(`transition ${id}: unsupported parameter mapping expression '${expression}'`);
      if (typeof expression === "string" && expression.startsWith("event.") && !eventPaths.includes(expression.slice(6))) {
        errors.push(`transition ${id}: '${expression}' is not declared by its trigger event payload`);
      }
      if (target && !(target.parameters ?? []).some((parameter) => parameter.name === name)) {
        errors.push(`transition ${id}: parameterMapping targets undeclared parameter '${name}'`);
      }
    }
    if (target) {
      for (const parameter of target.parameters ?? []) {
        if (parameter.required && !Object.hasOwn(transition.parameterMapping ?? {}, parameter.name)) {
          errors.push(`transition ${id}: required target parameter '${parameter.name}' is not mapped`);
        }
      }
    }

    if (transition.returnMapping && target && !["DIALOG", "DRAWER"].includes(target.pageType)) {
      errors.push(`transition ${id}: returnMapping is only supported for DIALOG/DRAWER targets`);
    }
    if (transition.returnMapping && target) {
      const targetComponentIds = pageComponentIds(target);
      const returnPaths = components
        .filter((component) => targetComponentIds.has(component.id))
        .flatMap((component) => component.eventPayloads?.[transition.returnEvent] ?? []);
      for (const [name, expression] of Object.entries(transition.returnMapping)) {
        if (!isValidMappingExpression(expression)) errors.push(`transition ${id}: unsupported return mapping expression '${expression}'`);
        if (typeof expression === "string" && expression.startsWith("event.") && !returnPaths.includes(expression.slice(6))) {
          errors.push(`transition ${id}: return mapping '${expression}' is not declared by return event '${transition.returnEvent}'`);
        }
        if (!(target.returnValues ?? []).some((value) => value.name === name)) {
          errors.push(`transition ${id}: returnMapping targets undeclared return value '${name}'`);
        }
      }
    }
  }

  for (const action of actions) {
    if (action.type === "API") {
      const api = apiById.get(action.apiId);
      if (!api) {
        errors.push(`action ${action.id}: unknown apiId '${action.apiId}'`);
      } else {
        if (action.httpMethod && action.httpMethod !== api.method) {
          errors.push(`action ${action.id}: httpMethod does not match API ${action.apiId}`);
        }
        const mapping = action.requestMapping ?? {};
        const pathParams = new Set([...api.path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]));
        const mappedPathParams = new Set(Object.keys(mapping.pathParameters ?? {}));
        if (!isDeepEqual(pathParams, mappedPathParams)) {
          errors.push(`action ${action.id}: path parameter mapping does not match API ${action.apiId}`);
        }
      }
      const mapping = action.requestMapping ?? {};
      const expressions = [
        ...Object.values(mapping.pathParameters ?? {}),
        ...Object.values(mapping.queryParameters ?? {}),
        ...(mapping.body ? [mapping.body] : []),
      ];
      for (const expression of expressions) {
        if (!isValidMappingExpression(expression)) {
          errors.push(`action ${action.id}: unsupported request mapping expression '${expression}'`);
        }
      }
    }
    if (action.type === "NAVIGATION" && !transitionById.has(action.transitionId)) {
      errors.push(`action ${action.id}: unknown transitionId '${action.transitionId}'`);
    }
    const success = action.success ?? {};
    if (success.behavior === "NAVIGATE" && !pageById.has(success.targetPageId)) {
      errors.push(`action ${action.id}: unknown success targetPageId '${success.targetPageId}'`);
    }
    if (success.behavior === "REFRESH_COMPONENT" && !componentIds.has(success.targetComponentId)) {
      errors.push(`action ${action.id}: unknown targetComponentId '${success.targetComponentId}'`);
    }
    if (success.behavior === "NAVIGATE") {
      const targetPage = pageById.get(success.targetPageId);
      if (targetPage) {
        const mapping = success.parameterMapping ?? {};
        for (const name of Object.keys(mapping)) {
          if (!(targetPage.parameters ?? []).some((parameter) => parameter.name === name)) {
            errors.push(`action ${action.id}: success parameterMapping targets undeclared parameter '${name}'`);
          }
        }
        for (const parameter of targetPage.parameters ?? []) {
          if (parameter.required && !Object.hasOwn(mapping, parameter.name)) {
            errors.push(`action ${action.id}: success navigation does not map required parameter '${parameter.name}'`);
          }
        }
        for (const expression of Object.values(mapping)) {
          if (!isValidMappingExpression(expression)) errors.push(`action ${action.id}: unsupported success mapping expression '${expression}'`);
          if (typeof expression === "string" && expression.startsWith("response.")) {
            const responseField = expression.slice(9);
            if (!(apiById.get(action.apiId)?.responseFields ?? []).includes(responseField)) {
              errors.push(`action ${action.id}: response mapping '${expression}' is not declared by its API`);
            }
          }
        }
      }
    }
  }

  for (const action of actions.filter((item) => item.type === "NAVIGATION")) {
    const transition = transitionById.get(action.transitionId);
    if (transition && (transition.trigger?.type !== "ACTION" || transition.trigger.actionId !== action.id)) {
      errors.push(`action ${action.id}: transition '${transition.id}' is not triggered by this action`);
    }
  }

  for (const component of components) {
    for (const binding of component.actionBindings ?? []) {
      const action = actionById.get(binding.actionId);
      if (!action) continue;
      if (action.type === "NAVIGATION") {
        const transition = transitionById.get(action.transitionId);
        const sourcePage = transition && pageById.get(transition.from);
        if (sourcePage && component.scope !== "GLOBAL") {
          if (!pageComponentIds(sourcePage).has(component.id)) {
            errors.push(`component ${component.id}: action '${action.id}' is bound outside its transition source page`);
          }
          for (const page of pages) {
            if (page.id !== sourcePage.id && pageComponentIds(page).has(component.id)) {
              errors.push(`component ${component.id}: navigation action '${action.id}' is also exposed on page '${page.id}'`);
            }
          }
        }
        if (transition) {
          for (const expression of Object.values(transition.parameterMapping ?? {})) {
            if (typeof expression === "string" && expression.startsWith("event.")
              && !(component.eventPayloads?.[binding.event] ?? []).includes(expression.slice(6))) {
              errors.push(`transition ${transition.id}: '${expression}' is not declared by component event '${component.id}.${binding.event}'`);
            }
          }
        }
      }
      const isUsed = component.scope === "GLOBAL" || pages.some((page) => pageComponentIds(page).has(component.id));
      if (!isUsed) errors.push(`component ${component.id}: action binding is not used by any page`);
    }
  }

  for (const action of actions) {
    const hasBinding = components.some((component) =>
      (component.actionBindings ?? []).some((binding) => binding.actionId === action.id));
    if (["API", "NAVIGATION"].includes(action.type) && !hasBinding) {
      errors.push(`action ${action.id}: no component event binding`);
    }
  }

  for (const action of actions.filter((item) => item.type === "API")) {
    const mapping = action.requestMapping ?? {};
    const expressions = [
      ...Object.values(mapping.pathParameters ?? {}),
      ...Object.values(mapping.queryParameters ?? {}),
      ...(mapping.body ? [mapping.body] : []),
    ];
    const boundComponents = components.filter((component) =>
      (component.actionBindings ?? []).some((binding) => binding.actionId === action.id));
    const boundPages = pages.filter((page) =>
      boundComponents.some((component) => pageComponentIds(page).has(component.id)));

    for (const expression of expressions) {
      if (typeof expression !== "string") continue;
      if (expression.startsWith("route.")) {
        const parameter = expression.slice(6);
        if (!boundPages.some((page) => (page.parameters ?? []).some((item) => item.name === parameter))) {
          errors.push(`action ${action.id}: requestMapping uses undeclared route parameter '${parameter}'`);
        }
      } else if (expression === "form") {
        const hasForm = boundPages.some((page) =>
          [...pageComponentIds(page)].some((id) => componentById.get(id)?.category === "FORM"));
        if (!hasForm) errors.push(`action ${action.id}: requestMapping uses form context on a page without a FORM component`);
      } else if (expression === "event") {
        const hasPayload = boundComponents.some((component) =>
          (component.actionBindings ?? []).some((binding) =>
            binding.actionId === action.id && Object.hasOwn(component.eventPayloads ?? {}, binding.event)));
        if (!hasPayload) errors.push(`action ${action.id}: requestMapping uses event context without a declared event payload`);
      } else if (expression.startsWith("event.")) {
        const payloadPath = expression.slice(6);
        const hasPayload = boundComponents.some((component) =>
          (component.actionBindings ?? []).some((binding) =>
            binding.actionId === action.id
              && (component.eventPayloads?.[binding.event] ?? []).includes(payloadPath)));
        if (!hasPayload) errors.push(`action ${action.id}: requestMapping uses undeclared event payload '${expression}'`);
      }
    }
  }

  for (const transition of transitions) {
    const actionId = transition.trigger?.actionId;
    if (!actionId || !actionById.has(actionId)) continue;
    const action = actionById.get(actionId);
    if (action.type === "NAVIGATION" && action.transitionId !== transition.id) {
      errors.push(`transition ${transition.id}: trigger action '${actionId}' points to a different transition`);
    }
  }

  for (const [dataPath, schemaPath] of [
    ["specifications/workflows/headcount-approval.json", "schemas/workflow.schema.json"],
    ["specifications/data-model/entities.json", "schemas/data-model.schema.json"],
    ["specifications/api/api-spec.json", "schemas/api.schema.json"],
    ["specifications/integration/successfactors.json", "schemas/integration.schema.json"],
  ]) validateAgainstSchema(load(dataPath), schemaPath, dataPath);

  for (const file of fs.readdirSync(path.join(ROOT, "specifications/modules")).filter((name) => name.endsWith(".json")).sort()) {
    const relativePath = `specifications/modules/${file}`;
    validateAgainstSchema(load(relativePath), "schemas/module.schema.json", relativePath);
  }

  if (errors.length > 0) {
    console.error("SPEC VALIDATION FAILED");
    for (const error of errors) console.error(` - ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log("SPEC VALIDATION PASSED");
  console.log(`- Project modules: ${project.modules?.length ?? 0}`);
  console.log(`- UI pages: ${pages.length}`);
  console.log(`- UI transitions: ${transitions.length}`);
  console.log(`- UI actions: ${actions.length}`);
  console.log(`- UI components: ${components.length}`);
  console.log(`- API definitions: ${apis.length}`);
}

validateSpecifications();
