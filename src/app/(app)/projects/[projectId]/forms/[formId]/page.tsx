import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/lib/session";
import { SubmitFormForm } from "@/components/SubmitFormForm";

export default async function FormManagePage({
  params,
}: {
  params: Promise<{ projectId: string; formId: string }>;
}) {
  const { projectId, formId } = await params;
  const { org } = await requireOrgContext();

  const form = await prisma.projectForm.findFirst({
    where: { id: formId, projectId, organizationId: org.id },
    include: {
      fields: { orderBy: { position: "asc" } },
      submissions: { orderBy: { createdAt: "desc" }, take: 20 },
      project: { select: { name: true } },
    },
  });
  if (!form) notFound();

  return (
    <>
      <p className="muted">
        <Link href={`/projects/${projectId}/forms`}>← Forms</Link>
      </p>
      <h1 className="page-title">{form.title}</h1>
      <p className="page-sub">
        {form.description || form.project.name} · slug <code>{form.slug}</code>
      </p>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Share <Link href={`/f/${form.slug}`}>/f/{form.slug}</Link> with teammates (must be signed
        in).
      </p>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>Try submit</h2>
      <SubmitFormForm
        formId={form.id}
        fields={form.fields.map((f) => ({
          id: f.id,
          label: f.label,
          fieldType: f.fieldType,
          required: f.required,
          options: f.options,
        }))}
      />

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginTop: "1.5rem" }}>
        Recent submissions
      </h2>
      <div className="card-list">
        {form.submissions.length === 0 ? <p className="muted">None yet.</p> : null}
        {form.submissions.map((s) => (
          <div key={s.id} className="card">
            <p className="muted">{s.createdAt.toLocaleString()}</p>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.85rem" }}>{s.payload}</pre>
            {s.createdTaskId ? (
              <Link href={`/tasks/${s.createdTaskId}`} className="btn btn-ghost" style={{ marginTop: 8 }}>
                Open task
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}
