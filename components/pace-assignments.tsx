"use client"

import { CalendarClock, Check, Clock3, Leaf, Mail, MoveRight, Sparkles } from "lucide-react"
import {
  bucketTask,
  daysUntil,
  effortPoints,
  formatDueDate,
  isTaskComplete,
  type AssignmentBucket,
  type PaceTask,
} from "@/components/pace-data"
import type { EnergyLevel } from "@/components/pace-energy-picker"

interface PaceAssignmentsProps {
  tasks: PaceTask[]
  energy: EnergyLevel
  guardActive: boolean
  today: string
  onToggleComplete: (taskId: string) => void
}

const bucketDetails: Array<{
  id: AssignmentBucket
  title: string
  description: string
  icon: typeof MoveRight
}> = [
  { id: "now", title: "Do now", description: "A small place to start.", icon: MoveRight },
  { id: "if-energy", title: "If energy shows up", description: "Only if it feels available.", icon: Sparkles },
  { id: "leave-alone", title: "Leave alone", description: "Saved for a day with more room.", icon: Leaf },
]

function getExtensionHref(task: PaceTask) {
  const subject = encodeURIComponent(`A little more time for ${task.name}`)
  const body = encodeURIComponent(
    `Hello,\n\nI’m working on ${task.name} for ${task.subject}, but I need a little more time. Would an extension be possible?\n\nThank you,`,
  )
  return `mailto:?subject=${subject}&body=${body}`
}

function DeadlineWarning({ task, today }: { task: PaceTask; today: string }) {
  return (
    <aside className="deadline-warning" aria-label="A deadline is coming up">
      <span className="deadline-icon"><CalendarClock aria-hidden="true" /></span>
      <div className="deadline-copy">
        <strong>{formatDueDate(task.dueDate, today)}: {task.name}</strong>
        <p>This is close. It’s okay to ask for more time, or to leave it for now.</p>
        <a className="extension-link" href={getExtensionHref(task)}>
          <Mail aria-hidden="true" />
          Draft an extension note
        </a>
      </div>
    </aside>
  )
}

function AssignmentRow({
  task,
  today,
  bucket,
  onToggleComplete,
}: {
  task: PaceTask
  today: string
  bucket: AssignmentBucket
  onToggleComplete: (taskId: string) => void
}) {
  const completed = isTaskComplete(task)
  const plannedForTomorrow = task.plannedDate > today

  return (
    <li className={`assignment-row${completed ? " is-complete" : ""}`}>
      {bucket !== "leave-alone" && (
        <button
          type="button"
          className="assignment-check"
          aria-label={`${completed ? "Mark as not done" : "Mark as done"}: ${task.name}`}
          aria-pressed={completed}
          onClick={() => onToggleComplete(task.id)}
        >
          {completed ? <Check aria-hidden="true" /> : <span aria-hidden="true" />}
        </button>
      )}
      <div className="assignment-copy">
        <p className="assignment-name">{task.name}</p>
        <div className="assignment-meta">
          <span>{task.subject}</span>
          <span aria-hidden="true">·</span>
          <span>{plannedForTomorrow ? "Moved to tomorrow" : formatDueDate(task.dueDate, today)}</span>
        </div>
        <div className="assignment-meta assignment-effort">
          <Clock3 aria-hidden="true" />
          <span>{task.estimatedMinutes} min</span>
          <span aria-hidden="true">·</span>
          <span>{task.effort} effort</span>
          <span className="sr-only">, about {effortPoints(task.effort)} estimated energy points</span>
        </div>
      </div>
    </li>
  )
}

export function PaceAssignments({ tasks, energy, guardActive, today, onToggleComplete }: PaceAssignmentsProps) {
  const assignments = tasks
    .map((task) => ({ task, bucket: bucketTask(task, energy, guardActive, today) }))
    .filter((item): item is { task: PaceTask; bucket: AssignmentBucket } => item.bucket !== null)
    .sort((first, second) => daysUntil(first.task.dueDate, today) - daysUntil(second.task.dueDate, today))

  const nearestDeadline = tasks
    .filter((task) => !isTaskComplete(task) && daysUntil(task.dueDate, today) <= 1)
    .sort((first, second) => daysUntil(first.dueDate, today) - daysUntil(second.dueDate, today))[0]
  const shouldShowWarning = Boolean(nearestDeadline && (guardActive || energy === "low" || energy === "drained"))

  return (
    <section className="assignment-planner" aria-labelledby="assignment-heading">
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">GENTLE SORTING</p>
          <h2 id="assignment-heading">Your assignments</h2>
        </div>
        <span className="task-count">{tasks.filter((task) => !isTaskComplete(task)).length} open</span>
      </div>
      <p className="section-intro">A suggestion based on your energy and due dates. You can change it anytime.</p>

      {shouldShowWarning && nearestDeadline && <DeadlineWarning task={nearestDeadline} today={today} />}

      <div className="assignment-buckets">
        {bucketDetails.map(({ id, title, description, icon: Icon }) => {
          const items = assignments.filter((item) => item.bucket === id)

          return (
            <section className={`assignment-bucket bucket-${id}`} key={id} aria-labelledby={`bucket-${id}`}>
              <div className="bucket-heading">
                <span className="bucket-icon"><Icon aria-hidden="true" /></span>
                <div>
                  <h3 id={`bucket-${id}`}>{title}</h3>
                  <p>{description}</p>
                </div>
                <span className="bucket-count" aria-label={`${items.length} assignments`}>{items.length}</span>
              </div>
              {items.length > 0 ? (
                <ul className="assignment-list">
                  {items.map(({ task }) => (
                    <AssignmentRow
                      key={task.id}
                      task={task}
                      today={today}
                      bucket={id}
                      onToggleComplete={onToggleComplete}
                    />
                  ))}
                </ul>
              ) : (
                <p className="empty-bucket">Nothing you need to move here right now.</p>
              )}
            </section>
          )
        })}
      </div>
    </section>
  )
}
