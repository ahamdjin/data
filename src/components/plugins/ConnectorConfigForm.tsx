"use client";

import * as React from "react";

type Field =
  | { key: string; label: string; type: "string" | "password"; required?: boolean; secret?: boolean; description?: string; defaultValue?: any }
  | { key: string; label: string; type: "number"; required?: boolean; description?: string; defaultValue?: any }
  | { key: string; label: string; type: "boolean"; required?: boolean; description?: string; defaultValue?: any }
  | { key: string; label: string; type: "json"; required?: boolean; description?: string; defaultValue?: any };

export type ConnectorSpecLite = {
  id: string;
  displayName: string;
  version: string;
  capabilities: string[];
  configSchema: Field[];
};

export function ConnectorConfigForm(props: {
  spec: ConnectorSpecLite;
  onTest: (values: Record<string, any>) => Promise<{ ok: boolean; error?: string }>;
  onSubmit?: (values: Record<string, any>) => void | Promise<void>;
  submitLabel?: string;
}) {
  const { spec, onTest, onSubmit, submitLabel = "Save" } = props;

  const [values, setValues] = React.useState<Record<string, any>>(() => {
    const v: Record<string, any> = {};
    for (const f of spec.configSchema) {
      if (typeof f.defaultValue !== "undefined") v[f.key] = f.defaultValue;
      else if (f.type === "boolean") v[f.key] = false;
      else v[f.key] = "";
    }
    return v;
  });

  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<null | { ok: boolean; error?: string }>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function setField(k: string, v: any) {
    setValues(s => ({ ...s, [k]: v }));
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTest(values);
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="text-xl font-semibold">{spec.displayName}</div>
        <div className="text-xs text-gray-500">v{spec.version}</div>
      </div>

      {spec.configSchema.length === 0 ? (
        <div className="text-sm text-gray-600">No configuration required.</div>
      ) : (
        spec.configSchema.map((f) => (
          <div key={f.key} className="space-y-1">
            <label className="block text-sm font-medium">
              {f.label}
              {f.required ? <span className="ml-1 text-red-500">*</span> : null}
            </label>
            {f.description ? <div className="text-xs text-gray-500">{f.description}</div> : null}

            {f.type === "string" || f.type === "password" ? (
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                type={f.type === "password" ? "password" : "text"}
                value={values[f.key] ?? ""}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.secret ? "••••••••" : ""}
                required={!!f.required}
                autoComplete={f.secret ? "new-password" : "off"}
              />
            ) : f.type === "number" ? (
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                type="number"
                value={values[f.key] ?? ""}
                onChange={(e) => setField(f.key, e.target.value === "" ? "" : Number(e.target.value))}
                required={!!f.required}
              />
            ) : f.type === "boolean" ? (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!values[f.key]}
                  onChange={(e) => setField(f.key, e.target.checked)}
                />
                <span className="text-sm">Enable</span>
              </div>
            ) : f.type === "json" ? (
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm font-mono min-h-[100px]"
                value={typeof values[f.key] === "string" ? values[f.key] : JSON.stringify(values[f.key] ?? {}, null, 2)}
                onChange={(e) => {
                  const t = e.target.value;
                  try {
                    const parsed = JSON.parse(t);
                    setField(f.key, parsed);
                  } catch {
                    setField(f.key, t); // keep as string until valid
                  }
                }}
                placeholder='{"key":"value"}'
                required={!!f.required}
              />
            ) : null}
          </div>
        ))
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {testing ? "Testing..." : "Test connection"}
        </button>

        {onSubmit ? (
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-black text-white px-3 py-2 text-sm hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        ) : null}

        {testResult && (
          <div className={`text-sm ${testResult.ok ? "text-green-600" : "text-red-600"}`}>
            {testResult.ok ? "Connection successful." : `Failed: ${testResult.error}`}
          </div>
        )}
      </div>
    </form>
  );
}
