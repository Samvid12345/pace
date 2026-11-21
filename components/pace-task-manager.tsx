"use client"

import { ArrowDown, ArrowUp, Check, Clock3, Edit3, Plus, Trash2, X } from "lucide-react"
import { useState, type FormEvent } from "react"
import { formatDueDate, isCompleteToday, isTaskComplete, shiftDateKey, type EffortLevel, type PaceTask } from "@/components/pace-data"

interface PaceTaskManagerProps {
  tasks: PaceTask[]
  today: string
  feedback: string
  completionFeedback: string
  undoTaskName?: string
  onSave: (draft: Omit<PaceTask, "id" | "plannedDate" | "completedOn">, taskId?: string) => void
  onToggleComplete: (taskId: string) => void
  onMove: (taskId: string, direction: -1 | 1) => void
  onDelete: (taskId: string) => void
  onUndoDelete: () => void
}

interface TaskDraft {
  name: string
  subject: string
  dueDate: string
  effort: EffortLevel
  estimatedMinutes: number
}

function createBlankDraft(today: string): TaskDraft {
  return {
    name: "",
    subject: "",
    dueDate: shiftDateKey(today, 1),
    effort: "low",
    estimatedMinutes: 15,
  }
}

export function PaceTaskManager({
  tasks,
  today,
  feedback,
  completionFeedback,
  undoTaskName,
  onSave,
  onToggleComplete,
  onMove,
  onDelete,
  onUndoDelete,
}: PaceTaskManagerProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | undefined>()
  const [draft, setDraft] = useState<TaskDraft>(() => createBlankDraft(today))
  const completedCount = tasks.filter((task) => isCompleteToday(task, today)).length

  function beginAdd() {
    setEditingId(undefined)
    setDraft(createBlankDraft(today))
    setFormOpen(true)
  }

  function beginEdit(task: PaceTask) {
    setEditingId(task.id)
    setDraft({
      name: task.name,
      subject: task.subject,
      dueDate: task.dueDate,
      effort: task.effort,
      estimatedMinutes: task.estimatedMinutes,
    })
    setFormOpen(true)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = draft.name.trim()
    const subject = draft.subject.trim()
    if (!name || !subject) return

    onSave({
      name,
      subject,
      dueDate: draft.dueDate,
      effort: draft.effort,
      estimatedMinutes: Math.max(5, Math.min(360, Math.round(draft.estimatedMinutes))),
    }, editingId)
    setFormOpen(false)
    setEditingId(undefined)
    setDraft(createBlankDraft(today))
  }

  return (
    <section className="task-manager" aria-labelledby="checklist-heading">
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">A LIST THAT CAN CHANGE</p>
          <h2 id="checklist-heading">Your checklist</h2>
        </div>
        <span className="task-count">{completedCount} done today</span>
      </div>
      <p className="section-intro">Add what matters, change the details, or move something to another spot.</p>

      {feedback && <p className="task-feedback" role="status">{feedback}</p>}
      {completionFeedback && <p className="task-feedback" role="status">{completionFeedback}</p>}
      {undoTaskName && (
        <div className="undo-notice" role="status">
          <span>“{undoTaskName}” was removed.</span>
          <button type="button" onClick={onUndoDelete}>Undo</button>
        </div>
      )}

      <button
        className="add-task-button"
        type="button"
        aria-expanded={formOpen}
        onClick={formOpen ? () => setFormOpen(false) : beginAdd}
      >
        {formOpen ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
        {formOpen ? "Close form" : "Add a task"}
      </button>

      {formOpen && (
        <form className="task-form" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h3>{editingId ? "Edit task" : "A small next step"}</h3>
            <p>Everything can be changed later.</p>
          </div>
          <label className="pace-field pace-field-full">
            <span>Task name</span>
            <input
              autoFocus
              required
              maxLength={100}
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="e.g., Add three bullets to my reflection"
            />
          </label>
          <div className="task-form-grid">
            <label className="pace-field">
              <span>Subject</span>
              <input
                required
                maxLength={40}
                value={draft.subject}
                onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
                placeholder="Biology"
              />
            </label>
            <label className="pace-field">
              <span>Due date</span>
              <input
                required
                type="date"
                value={draft.dueDate}
                onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </label>
            <label className="pace-field">
              <span>Effort</span>
              <select
                value={draft.effort}
                onChange={(event) => setDraft((current) => ({ ...current, effort: event.target.value as EffortLevel }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="pace-field">
              <span>Estimated time (minutes)</span>
              <input
                required
                type="number"
                min={5}
                max={360}
                step={5}
                value={draft.estimatedMinutes}
                onChange={(event) => setDraft((current) => ({ ...current, estimatedMinutes: Number(event.target.value) }))}
              />
            </label>
          </div>
          <div className="task-form-actions">
            <button className="task-save-button" type="submit">{editingId ? "Save changes" : "Add to checklist"}</button>
            <button className="task-cancel-button" type="button" onClick={() => setFormOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      {tasks.length > 0 ? (
        <ul className="checklist-list">
          {tasks.map((task, index) => {
            const completed = isTaskComplete(task)
            return (
              <li className={`checklist-row${completed ? " is-complete" : ""}`} key={task.id}>
                <button
                  className="checklist-check"
                  type="button"
                  aria-label={`${completed ? "Mark as not done" : "Mark as done"}: ${task.name}`}
                  aria-pressed={completed}
                  onClick={() => onToggleComplete(task.id)}
                >
                  {completed ? <Check aria-hidden="true" /> : <span aria-hidden="true" />}
                </button>
                <div className="checklist-copy">
                  <p className="checklist-name">{task.name}</p>
                  <div className="checklist-meta">
                    <span>{task.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDueDate(task.dueDate, today)}</span>
                    <span aria-hidden="true">·</span>
                    <span className={`effort-tag effort-${task.effort}`}>{task.effort}</span>
                    <span aria-hidden="true">·</span>
                    <span><Clock3 aria-hidden="true" />{task.estimatedMinutes} min</span>
                  </div>
                </div>
                <div className="checklist-actions" aria-label={`Actions for ${task.name}`}>
                  <button type="button" aria-label={`Move ${task.name} up`} disabled={index === 0} onClick={() => onMove(task.id, -1)}>
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={`Move ${task.name} down`} disabled={index === tasks.length - 1} onClick={() => onMove(task.id, 1)}>
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={`Edit ${task.name}`} onClick={() => beginEdit(task)}>
                    <Edit3 aria-hidden="true" />
                  </button>
                  <button className="delete-task-action" type="button" aria-label={`Delete ${task.name}`} onClick={() => onDelete(task.id)}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="empty-checklist">
          <p>Your list has room for something new.</p>
          <button type="button" onClick={beginAdd}>Add a first task</button>
        </div>
      )}
      <p className="local-save-note">Your checklist is saved only in this browser.</p>
    </section>
  )
}
