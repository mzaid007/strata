import Link from "next/link";

const tabs = [
  { suffix: "", label: "List" },
  { suffix: "/board", label: "Board" },
  { suffix: "/calendar", label: "Calendar" },
  { suffix: "/timeline", label: "Timeline" },
  { suffix: "/forms", label: "Forms" },
  { suffix: "/rules", label: "Rules" },
] as const;

export function ProjectViewTabs({
  projectId,
  active,
}: {
  projectId: string;
  active: (typeof tabs)[number]["label"];
}) {
  return (
    <div className="view-tabs" role="tablist" aria-label="Project views">
      {tabs.map((t) => (
        <Link
          key={t.label}
          className="view-tab"
          href={`/projects/${projectId}${t.suffix}`}
          prefetch
          data-active={t.label === active}
          role="tab"
          aria-selected={t.label === active}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
