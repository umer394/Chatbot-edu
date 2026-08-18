import { DEFAULT_VARIABLES } from "@/types/campaign";

export default function VariableGuide() {
  return (
    <div className="rounded-lg border border-blue-200/60 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
      <h3 className="text-sm font-semibold text-foreground">Dynamic variables guide</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Use double curly braces in subject or body. Values are filled per recipient when the
        campaign runs.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEFAULT_VARIABLES.map((v) => (
          <code
            key={v}
            className="rounded-md bg-background px-2 py-1 text-xs font-medium text-primary ring-1 ring-border"
          >
            {`{{${v}}}`}
          </code>
        ))}
        <code className="rounded-md bg-background px-2 py-1 text-xs font-medium text-primary ring-1 ring-border">
          {"{{customField}}"}
        </code>
      </div>
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        <li>
          <strong className="text-foreground">{"{{name}}"}</strong> — recipient full name
        </li>
        <li>
          <strong className="text-foreground">{"{{company}}"}</strong> — recipient company
        </li>
        <li>
          <strong className="text-foreground">{"{{email}}"}</strong> — recipient email address
        </li>
        <li>
          Add custom keys in the recipient row; reference them as{" "}
          <code className="rounded bg-muted px-1">{"{{yourKey}}"}</code>
        </li>
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Example body:{" "}
        <em>
          Hi {"{{name}}"}, we noticed {"{{company}}"} might benefit from our offer. Reply to{" "}
          {"{{email}}"} if interested.
        </em>
      </p>
    </div>
  );
}
