import type { BlockConfig } from "../types/experiment";

export type Expression =
  | { op: "literal"; value: unknown }
  | { op: "variable"; name: string }
  | { op: "equals"|"notEquals"|"gt"|"lt"|"gte"|"lte"|"and"|"or"|"in"|"contains"; left: Expression; right: Expression }
  | { op: "not"; value: Expression }
  | { op: "add"|"subtract"|"multiply"|"divide"|"modulo"; left: Expression; right: Expression }
  | { op: "randomChoice"; values: Expression[] }
  | { op: "randomNumber"; min: Expression; max: Expression };

export interface ExpressionContext {
  variables: Record<string, unknown>;
}

const asNumber = (v: unknown) => typeof v === "number" ? v : Number(v);

export function evaluateExpression(expr: unknown, ctx: ExpressionContext): unknown {
  if (typeof expr === "string") {
    const text=expr.trim();
    const m=text.match(/^([A-Za-z_$][\\w$]*)\\s*(===|==|!==|!=|>=|<=|>|<)\\s*(.+)$/);
    if(m){
      const left=ctx.variables[m[1]];
      const raw=m[3].trim().replace(/^['"]|['"]$/g,"");
      const right=raw in ctx.variables ? ctx.variables[raw] : (raw==="true"?true:raw==="false"?false:(raw!=="" && !Number.isNaN(Number(raw))?Number(raw):raw));
      switch(m[2]){case "===":case "==":return left===right;case "!==":case "!=":return left!==right;case ">":return asNumber(left)>asNumber(right);case "<":return asNumber(left)<asNumber(right);case ">=":return asNumber(left)>=asNumber(right);case "<=":return asNumber(left)<=asNumber(right);}
    }
    return Boolean(ctx.variables[text] ?? text);
  }
  if (expr === undefined || expr === null) return null;
  if (typeof expr !== "object") return expr;
  const e = expr as Record<string, unknown>;
  switch (e.op) {
    case "literal": return e.value;
    case "variable": return ctx.variables[String(e.name)];
    case "equals": return evaluateExpression(e.left,ctx) === evaluateExpression(e.right,ctx);
    case "notEquals": return evaluateExpression(e.left,ctx) !== evaluateExpression(e.right,ctx);
    case "gt": return asNumber(evaluateExpression(e.left,ctx)) > asNumber(evaluateExpression(e.right,ctx));
    case "lt": return asNumber(evaluateExpression(e.left,ctx)) < asNumber(evaluateExpression(e.right,ctx));
    case "gte": return asNumber(evaluateExpression(e.left,ctx)) >= asNumber(evaluateExpression(e.right,ctx));
    case "lte": return asNumber(evaluateExpression(e.left,ctx)) <= asNumber(evaluateExpression(e.right,ctx));
    case "and": return Boolean(evaluateExpression(e.left,ctx)) && Boolean(evaluateExpression(e.right,ctx));
    case "or": return Boolean(evaluateExpression(e.left,ctx)) || Boolean(evaluateExpression(e.right,ctx));
    case "not": return !Boolean(evaluateExpression(e.value,ctx));
    case "add": return asNumber(evaluateExpression(e.left,ctx)) + asNumber(evaluateExpression(e.right,ctx));
    case "subtract": return asNumber(evaluateExpression(e.left,ctx)) - asNumber(evaluateExpression(e.right,ctx));
    case "multiply": return asNumber(evaluateExpression(e.left,ctx)) * asNumber(evaluateExpression(e.right,ctx));
    case "divide": {
      const b=asNumber(evaluateExpression(e.right,ctx)); if (b===0) throw new Error("Expression division by zero.");
      return asNumber(evaluateExpression(e.left,ctx))/b;
    }
    case "modulo": return asNumber(evaluateExpression(e.left,ctx)) % asNumber(evaluateExpression(e.right,ctx));
    case "in": {
      const a=evaluateExpression(e.left,ctx), b=evaluateExpression(e.right,ctx);
      return Array.isArray(b) ? b.includes(a) : false;
    }
    case "contains": {
      const a=evaluateExpression(e.left,ctx), b=evaluateExpression(e.right,ctx);
      return typeof a==="string" ? a.includes(String(b)) : Array.isArray(a) ? a.includes(b) : false;
    }
    case "randomChoice": {
      const values=(Array.isArray(e.values)?e.values:[]).map(x=>evaluateExpression(x,ctx));
      return values.length ? values[Math.floor(Math.random()*values.length)] : null;
    }
    case "randomNumber": {
      const min=asNumber(evaluateExpression(e.min,ctx)), max=asNumber(evaluateExpression(e.max,ctx));
      return min + Math.random()*(max-min);
    }
    default: throw new Error(`Unsupported expression operator: ${String(e.op)}`);
  }
}

export function evaluateConfigValue(value: unknown, ctx: ExpressionContext): unknown {
  if (value && typeof value === "object" && "op" in (value as object)) return evaluateExpression(value,ctx);
  if (typeof value === "string") {
    const m=value.match(/^\$\{([^}]+)\}$/);
    if (m) return ctx.variables[m[1]];
  }
  return value;
}

export function validateExpression(expr: unknown, variableNames: Set<string>, errors: string[], path="expression"): void {
  if (expr === undefined || expr === null) return;
  if (typeof expr !== "object") return;
  const e=expr as Record<string,unknown>, op=String(e.op ?? "");
  const unary=["not"], binary=["equals","notEquals","gt","lt","gte","lte","and","or","in","contains","add","subtract","multiply","divide","modulo"];
  if (op==="variable") {
    if (!variableNames.has(String(e.name))) errors.push(`${path} references missing variable "${String(e.name)}".`);
    return;
  }
  if (op==="literal") return;
  if (unary.includes(op)) validateExpression(e.value,variableNames,errors,`${path}.${op}`);
  else if (binary.includes(op)) { validateExpression(e.left,variableNames,errors,`${path}.left`); validateExpression(e.right,variableNames,errors,`${path}.right`); }
  else if (op==="randomChoice") (Array.isArray(e.values)?e.values:[]).forEach((x,i)=>validateExpression(x,variableNames,errors,`${path}.values[${i}]`));
  else if (op==="randomNumber") { validateExpression(e.min,variableNames,errors,`${path}.min`); validateExpression(e.max,variableNames,errors,`${path}.max`); }
  else errors.push(`${path} uses unsupported expression operator "${op}".`);
}

export function coerceExpression(value: unknown): Expression {
  if (value && typeof value === "object" && "op" in (value as object)) return value as Expression;
  return {op:"literal", value};
}

export type { BlockConfig };
