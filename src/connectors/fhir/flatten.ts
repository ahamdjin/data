// Minimal, readable projection from a FHIR Resource to text.
// We avoid LLMs here; just pick salient fields per type with fallbacks.

type AnyRes = { resourceType: string; id?: string; [k:string]: any };

function val(x: any): string {
  if (x == null) return "";
  if (typeof x === "string" || typeof x === "number" || typeof x === "boolean") return String(x);
  if (Array.isArray(x)) return x.map(val).filter(Boolean).join("; ");
  if (x.text) return val(x.text);
  if (x.coding && Array.isArray(x.coding)) return x.coding.map((c:any)=>c.display||c.code).filter(Boolean).join(", ");
  return "";
}

export function flattenResource(r: AnyRes): { title: string; text: string } {
  const t = r.resourceType;
  const id = r.id ?? "";
  const header = `${t}/${id}`;

  const chunks: string[] = [];
  const push = (k: string, v: any) => { const s = val(v); if (s) chunks.push(`${k}: ${s}`); };

  switch (t) {
    case "Patient":
      push("name", r.name?.map((n:any)=>[n.given?.join(" "), n.family].filter(Boolean).join(" ")));
      push("gender", r.gender);
      push("birthDate", r.birthDate);
      push("address", r.address?.[0]?.text);
      break;

    case "Condition":
      push("code", r.code);
      push("clinicalStatus", r.clinicalStatus);
      push("onset", r.onsetDateTime || r.onsetPeriod);
      push("note", r.note?.map((n:any)=>n.text));
      push("subject", r.subject?.display || r.subject?.reference);
      break;

    case "Observation":
      push("code", r.code);
      push("value", r.valueQuantity || r.valueString || r.valueCodeableConcept);
      push("interpretation", r.interpretation);
      push("effective", r.effectiveDateTime || r.effectivePeriod);
      push("subject", r.subject?.display || r.subject?.reference);
      break;

    case "DocumentReference":
      push("type", r.type);
      push("category", r.category);
      push("date", r.date);
      push("description", r.description);
      push("content", r.content?.map((c:any)=>c.attachment?.title || c.attachment?.url || c.attachment?.contentType));
      break;

    case "Encounter":
      push("class", r.class);
      push("type", r.type);
      push("period", r.period);
      push("reason", r.reasonCode);
      push("subject", r.subject?.display || r.subject?.reference);
      break;

    default:
      // Generic fallback: use meta + text.div if present
      push("meta", r.meta);
      if (r.text?.div) {
        const stripped = String(r.text.div).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        push("summary", stripped);
      }
  }

  const text = [header, ...chunks].join("\n");
  return { title: header, text };
}
