"use client";

import { useActionState } from "react";
import {
  addTaskFollower,
  followTaskMyself,
  removeTaskFollower,
  unfollowTaskMyself,
} from "@/app/actions/collab";
import { initialActionState } from "@/lib/action-result";
import { FormBanner } from "@/components/FormBanner";

export function FollowersPanel({
  taskId,
  currentUserId,
  followers,
  members,
}: {
  taskId: string;
  currentUserId: string;
  followers: { userId: string; name: string }[];
  members: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(addTaskFollower, initialActionState);
  const following = followers.some((f) => f.userId === currentUserId);
  const available = members.filter((m) => !followers.some((f) => f.userId === m.id));

  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Followers</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Followers get notified on comments (in addition to assignee/creator).
      </p>
      {followers.length === 0 ? (
        <p className="muted">No followers yet.</p>
      ) : (
        <ul className="subtask-list">
          {followers.map((f) => (
            <li key={f.userId} className="row" style={{ justifyContent: "space-between" }}>
              <span>
                {f.name}
                {f.userId === currentUserId ? " (you)" : ""}
              </span>
              <form action={removeTaskFollower.bind(null, taskId, f.userId)}>
                <button className="btn btn-ghost" type="submit">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <div className="row" style={{ marginTop: "0.65rem", gap: "0.5rem", flexWrap: "wrap" }}>
        <form action={following ? unfollowTaskMyself.bind(null, taskId) : followTaskMyself.bind(null, taskId)}>
          <button className="btn btn-ghost" type="submit">
            {following ? "Unfollow" : "Follow"}
          </button>
        </form>
      </div>
      {available.length > 0 ? (
        <form action={action} style={{ marginTop: "0.75rem" }}>
          <FormBanner state={state} />
          <input type="hidden" name="taskId" value={taskId} />
          <div className="field">
            <label htmlFor="followerId">Add follower</label>
            <select id="followerId" name="userId" required defaultValue="">
              <option value="" disabled>
                Choose member…
              </option>
              {available.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add follower"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
