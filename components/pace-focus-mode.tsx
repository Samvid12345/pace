"use client"

import { ArrowRight, Check, Play, RotateCcw } from "lucide-react"
import { useMemo, useState } from "react"
import { isTaskComplete, type PaceTask } from "@/components/pace-data"
import type { EnergyLevel } from "@/components/pace-energy-picker"

interface PaceFocusModeProps {
  tasks: PaceTask[]
  energy: EnergyLevel
  onCompleteTask: (taskId: string) => void
}

export function PaceFocusMode({ tasks, energy, onCompleteTask }: PaceFocusModeProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [breathing, setBreathing] = useState(false)
  const openTasks = useMemo(() => tasks.filter((task) => !isTaskComplete(task)), [tasks])
  const task = openTasks[selectedIndex % Math.max(1, openTasks.length)]
  const stepLabels = ["Set up one thing you need", "Try one small part", "Pause and notice how it felt"]

  function toggleStep(index: number) {
    setCompletedSteps((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])
  }

  function nextTask() {
    setSelectedIndex((current) => (current + 1) % Math.max(1, openTasks.length))
    setCompletedSteps([])
  }

  return (
    <div className="focus-view">
      <section className="view-intro" aria-labelledby="focus-heading">
        <p className="welcome-kicker">ONE THING, THEN A PAUSE</p>
        <h1 id="focus-heading">Focus gently.</h1>
        <p>No timer to beat. Just one small step at a time.</p>
      </section>

      {task ? (
        <section className="focus-task-card" aria-labelledby="focus-task-heading">
          <p className="section-kicker">ONE TASK FOR NOW</p>
          <h2 id="focus-task-heading">{task.name}</h2>
          <p className="focus-task-meta">{task.subject} · {task.estimatedMinutes} min · {task.taskType}</p>
          <ol className="focus-steps">
            {stepLabels.map((label, index) => {
              const isDone = completedSteps.includes(index)
              return (
                <li key={label}>
                  <button type="button" aria-pressed={isDone} onClick={() => toggleStep(index)}>
                    <span className="focus-step-check">{isDone && <Check aria-hidden="true" />}</span>
                    <span><small>Part {index + 1}</small>{index === 1 ? label.replace("one small part", `one small part of ${task.name}`) : label}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="focus-task-actions">
            <button className="task-save-button" type="button" onClick={() => onCompleteTask(task.id)}>That&apos;s enough for now</button>
            {openTasks.length > 1 && <button className="task-cancel-button" type="button" onClick={nextTask}>Another task <ArrowRight aria-hidden="true" /></button>}
          </div>
        </section>
      ) : (
        <section className="focus-task-card focus-rest-state" role="status">
          <p className="section-kicker">NOTHING TO PUSH THROUGH</p>
          <h2>{energy === "drained" ? "Rest can be the whole plan." : "You have no open tasks right now."}</h2>
          <p>Come back whenever a small next step feels useful.</p>
        </section>
      )}

      <section className="breathing-card" aria-labelledby="breathing-heading">
        <div className="breathing-copy">
          <p className="section-kicker">A QUIET MOMENT</p>
          <h2 id="breathing-heading">A slow breathing pace</h2>
          <p>Follow the circle if it feels comfortable. You can stop at any time.</p>
        </div>
        <div className={`breathing-circle${breathing ? " is-breathing" : ""}`} role="img" aria-label="Breathing pacer: breathe in gently, then breathe out slowly.">
          <span>{breathing ? "Breathe" : "Pause"}</span>
        </div>
        <div className="breathing-actions">
          <button className="task-save-button" type="button" aria-pressed={breathing} onClick={() => setBreathing((current) => !current)}>
            {breathing ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" />}
            {breathing ? "Pause pacer" : "Start slow breathing"}
          </button>
          <p>{breathing ? "In for four, out for six. No need to match it exactly." : "A gentle inhale and longer exhale, with no rush."}</p>
        </div>
      </section>
    </div>
  )
}
