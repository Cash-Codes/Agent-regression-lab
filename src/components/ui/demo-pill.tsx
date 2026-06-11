export function DemoPill() {
  if (process.env.ANTHROPIC_API_KEY) return null;
  return (
    <span className="bg-pill-tool-soft text-pill-tool rounded-full px-2 py-0.5 text-xs font-medium">
      demo · mock LLM
    </span>
  );
}
