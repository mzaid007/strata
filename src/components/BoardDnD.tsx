"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moveTaskMembership } from "@/app/actions/workspace";
import { MoveToSectionForm } from "@/components/MoveToSectionForm";

type SectionOption = { id: string; name: string };

type BoardTask = {
  membershipId: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  sectionId: string;
};

type BoardSection = {
  id: string;
  name: string;
  tasks: BoardTask[];
};

export function BoardDnD({
  projectId,
  sections,
}: {
  projectId: string;
  sections: BoardSection[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [overSectionId, setOverSectionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sectionOptions: SectionOption[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  function onDrop(sectionId: string) {
    if (!dragTaskId) return;
    const from = sections.find((s) => s.tasks.some((t) => t.taskId === dragTaskId));
    if (!from || from.id === sectionId) {
      setDragTaskId(null);
      setOverSectionId(null);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await moveTaskMembership({
        taskId: dragTaskId,
        projectId,
        sectionId,
      });
      setDragTaskId(null);
      setOverSectionId(null);
      if (result.ok === false) {
        setError(result.error || "Move failed");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {error ? <p className="error">{error}</p> : null}
      {pending ? <p className="muted">Moving…</p> : null}
      <div className="board">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`column${overSectionId === section.id ? " board-column-drop" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverSectionId(section.id);
            }}
            onDragLeave={() => {
              setOverSectionId((cur) => (cur === section.id ? null : cur));
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(section.id);
            }}
          >
            <h3>
              {section.name} · {section.tasks.length}
            </h3>
            {section.tasks.map((task) => (
              <div
                key={task.membershipId}
                className={`task-pill${dragTaskId === task.taskId ? " board-card-dragging" : ""}`}
                draggable
                onDragStart={() => setDragTaskId(task.taskId)}
                onDragEnd={() => {
                  setDragTaskId(null);
                  setOverSectionId(null);
                }}
              >
                <Link href={`/tasks/${task.taskId}`}>
                  <span
                    style={{
                      textDecoration: task.completed ? "line-through" : "none",
                      fontWeight: 600,
                    }}
                  >
                    {task.title}
                  </span>
                </Link>
                <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.75rem" }}>
                  Drag to another column
                </p>
                <div style={{ marginTop: "0.45rem" }}>
                  <MoveToSectionForm
                    taskId={task.taskId}
                    projectId={projectId}
                    currentSectionId={section.id}
                    sections={sectionOptions}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
