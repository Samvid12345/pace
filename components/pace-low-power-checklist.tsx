"use client"

import { Check, Clock3 } from "lucide-react"
import { daysUntil, effortPoints, formatDueDate, isTaskComplete, taskTypeLabels, type PaceTask } from "@/components/pace-data"
import { DeadlineWarning } from "@/components/pace-assignments"

interface PaceLowPowerChecklistProps {
  tasks: PaceTask[]
  today: string
  remainingEnergy: number
  onToggleComplete: (taskId: string) => void
  onSplitTask: (taskId: string) => void
}

export function PaceLowPowerChecklist({ tasks, today, remainingEnergy, onToggleComplete, onSplitTask }: PaceLowPowerChecklistProps) {
  const mustDos = tasks.filter((task) => task.dueDate <= today)
  const nearestDeadline = tasks
    .filter((task) => !isTaskComplete(task) && daysUntil(task.dueDate, today) <= 1)
    .sort((first, second) => daysUntil(first.dueDate, today) - daysUntil(second.dueDate, today))[0]

  return (
    <section className="low-power-checklist" aria-labelledby="low-power-heading">
      <p className="section-kicker">LOW POWER · MUST-DOS ONLY</p>
      <h2 id="low-power-heading">Only what may need attention</h2>
      <p className="low-power-intro">Everything else can wait. Rest is part of the plan.</p>
      {nearestDeadline && <DeadlineWarning task={nearestDeadline} today={today} />}
      {mustDos.length > 0 ? (
        <ul className="low-power-task-list">
          {mustDos.map((task) => {
            const completed = isTaskComplete(task)
            const mayNotFit = !completed && effortPoints(task.effort) > remainingEnergy
            return (
              <li className={completed ? "is-complete" : ""} key={task.id}>
                <button className="checklist-check" type="button" aria-label={`${completed ? "Mark as not done" : "Mark as done"}: ${task.name}`} aria-pressed={completed} onClick={() => onToggleComplete(task.id)}>
                  {completed ? <Check aria-hidden="true" /> : <span aria-hidden="true" />}
                </button>
                <div className="low-power-task-copy">
                  <strong>{task.name}</strong>
                  <span>{formatDueDate(task.dueDate, today)} · {taskTypeLabels[task.taskType]} · <Clock3 aria-hidden="true" /> {task.estimatedMinutes} min</span>
                  {mayNotFit && <div className="energy-fit-note"><span>This may not fit the energy you have left today.</span><button type="button" onClick={() => onSplitTask(task.id)}>Do part one today, rest tomorrow</button></div>}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="low-power-empty">Nothing is due today. You can let school be quiet and rest.</p>
      )}
    </section>
  )
}
