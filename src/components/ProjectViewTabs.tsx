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
    <div className="view-tabs">
      {tabs.map((t) => (
        <Link
          key={t.label}
          className={t.label === active ? "btn" : "btn btn-ghost"}
          href={`/projects/${projectId}${t.suffix}`}
          prefetch
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
