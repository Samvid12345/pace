"use client"

import { ArrowDownRight, Check, Clock3, Leaf, MoveRight } from "lucide-react"
import type { EnergyLevel } from "@/components/pace-energy-picker"

interface PlanItem {
  id: string
  title: string
  detail: string
  time: string
  canComplete?: boolean
}

interface EnergyPlan {
  intro: string
  now: PlanItem
  ifEnergy: PlanItem
  safeToPush: string
  safeToPushDetail: string
  leaveAlone: string
  leaveAloneDetail: string
  close: string
}

const plans: Record<EnergyLevel, EnergyPlan> = {
  drained: {
    intro: "Rest is a real plan. School can be quiet for a while.",
    now: {
      id: "rest",
      title: "Let school wait while you rest",
      detail: "Close the tabs if that feels good. You can come back another day.",
      time: "Rest first",
    },
    ifEnergy: {
      id: "portal-check",
      title: "Glance at one due date",
      detail: "Only if it would settle your mind. You can stop after opening the portal.",
      time: "2 min",
    },
    safeToPush: "Every school task on this list",
    safeToPushDetail: "Nothing here is worth spending your recovery on today.",
    leaveAlone: "A catch-up session",
    leaveAloneDetail: "No big decisions or “making up for lost time” today.",
    close: "You don’t have to earn a pause.",
  },
  low: {
    intro: "One small, useful step — with plenty of room to stop.",
    now: {
      id: "teacher-email",
      title: "Send a short note to your teacher",
      detail: "You can ask your teacher for a little more time on the biology reflection.",
      time: "5 min",
      canComplete: true,
    },
    ifEnergy: {
      id: "two-flashcards",
      title: "Review two biology flashcards",
      detail: "A tiny touchpoint counts. Leave the rest for another day.",
      time: "3 min",
      canComplete: true,
    },
    safeToPush: "Read the full chapter",
    safeToPushDetail: "Move it to a day with a little more room in the tank.",
    leaveAlone: "Polishing the whole essay",
    leaveAloneDetail: "That can wait; it asks for more focus than you need to give today.",
    close: "A little is enough. Stopping is allowed.",
  },
  okay: {
    intro: "A steady step, then check in with yourself again.",
    now: {
      id: "lab-bullets",
      title: "Add three bullets to your lab reflection",
      detail: "Just capture the main idea. No need to turn it into a full draft.",
      time: "15 min",
      canComplete: true,
    },
    ifEnergy: {
      id: "essay-outline",
      title: "Sketch an outline for your history essay",
      detail: "A few headings are plenty. Pause if your energy starts to dip.",
      time: "10 min",
      canComplete: true,
    },
    safeToPush: "Reading every lecture note",
    safeToPushDetail: "Keep the rest for later instead of stretching this good moment.",
    leaveAlone: "A long study sprint",
    leaveAloneDetail: "Your energy may change. Keep a little in reserve for yourself.",
    close: "Your energy is information, not a promise.",
  },
  charged: {
    intro: "There’s some room today. Let’s use it gently, not all at once.",
    now: {
      id: "essay-opening",
      title: "Draft the opening of your history essay",
      detail: "Aim for a rough first paragraph, not a perfect one.",
      time: "20 min",
      canComplete: true,
    },
    ifEnergy: {
      id: "lab-review",
      title: "Review your biology lab notes",
      detail: "Choose one section, then take a proper break before anything else.",
      time: "15 min",
      canComplete: true,
    },
    safeToPush: "The extra reading and flashcards",
    safeToPushDetail: "You don’t need to fill every spare minute with schoolwork.",
    leaveAlone: "Skipping breaks to get ahead",
    leaveAloneDetail: "A charged day still deserves care and room to recharge.",
    close: "Use some energy. Keep some for later, too.",
  },
}

interface PacePlanProps {
  energy: EnergyLevel
  completed: Record<string, boolean>
  onToggleComplete: (id: string) => void
}

function PlanTask({
  item,
  completed,
  onToggleComplete,
  kind,
}: {
  item: PlanItem
  completed: boolean
  onToggleComplete: (id: string) => void
  kind: "now" | "optional"
}) {
  return (
    <div className={`plan-task${completed ? " is-complete" : ""}`}>
      <div className="plan-task-copy">
        <p className="plan-task-title">{item.title}</p>
        <p className="plan-task-detail">{item.detail}</p>
        <span className="task-time">
          <Clock3 aria-hidden="true" />
          {item.time}
        </span>
      </div>
      {item.canComplete && (
        <button
          className="task-check"
          type="button"
          aria-label={`${completed ? "Mark as not done" : "Mark as done"}: ${item.title}`}
          aria-pressed={completed}
          onClick={() => onToggleComplete(item.id)}
        >
          {completed ? <Check aria-hidden="true" /> : <span aria-hidden="true" />}
        </button>
      )}
      {kind === "optional" && !item.canComplete && <span className="optional-dot" aria-hidden="true" />}
    </div>
  )
}

export function PacePlan({ energy, completed, onToggleComplete }: PacePlanProps) {
  const plan = plans[energy]
  const nowIsComplete = Boolean(completed[plan.now.id])
  const optionalIsComplete = Boolean(completed[plan.ifEnergy.id])

  return (
    <section className="plan-section" id="school-plan" aria-labelledby="plan-heading">
      <div className="plan-heading-row">
        <div>
          <p className="section-kicker">A PLAN THAT CAN BEND</p>
          <h2 id="plan-heading">Your school day</h2>
        </div>
      </div>
      <p className="plan-intro">{plan.intro}</p>

      <article className="plan-card now-card">
        <div className="plan-card-header">
          <span className="plan-label"><span className="label-dot" />Do now</span>
          <ArrowDownRight className="plan-card-mark" aria-hidden="true" />
        </div>
        <PlanTask
          item={plan.now}
          completed={nowIsComplete}
          onToggleComplete={onToggleComplete}
          kind="now"
        />
        {nowIsComplete && <p className="gentle-confirmation" role="status">That’s enough for now. Take a pause.</p>}
      </article>

      <article className="plan-card maybe-card">
        <div className="plan-card-header">
          <span className="plan-label"><Leaf className="leaf-mark" aria-hidden="true" />If energy shows up</span>
          <span className="optional-label">Optional</span>
        </div>
        <PlanTask
          item={plan.ifEnergy}
          completed={optionalIsComplete}
          onToggleComplete={onToggleComplete}
          kind="optional"
        />
        {optionalIsComplete && <p className="gentle-confirmation" role="status">Lovely. You can leave the rest.</p>}
      </article>

      <div className="boundaries-grid">
        <article className="boundary-card push-card">
          <span className="boundary-icon"><MoveRight aria-hidden="true" /></span>
          <p className="boundary-kicker">SAFE TO PUSH</p>
          <h3>{plan.safeToPush}</h3>
          <p>{plan.safeToPushDetail}</p>
        </article>
        <article className="boundary-card leave-card" id="rest-note">
          <span className="boundary-icon"><span className="rest-dot" /></span>
          <p className="boundary-kicker">LEAVE ALONE</p>
          <h3>{plan.leaveAlone}</h3>
          <p>{plan.leaveAloneDetail}</p>
        </article>
      </div>
      <p className="closing-note">{plan.close}</p>
    </section>
  )
}

const demoTasks = [
  { title: "Email a teacher about the biology reflection", meta: "Today · about 5 min", status: "Easy to break up" },
  { title: "Biology lab reflection", meta: "Due tomorrow · about 25 min", status: "A few short sessions" },
  { title: "History essay opening", meta: "Due Friday · about 40 min", status: "Flexible" },
]

export function DemoTaskList() {
  return (
    <section className="demo-tasks" aria-labelledby="demo-tasks-heading">
      <div className="plan-heading-row">
        <div>
          <p className="section-kicker">A LITTLE CONTEXT</p>
          <h2 id="demo-tasks-heading">Your demo task list</h2>
        </div>
        <span className="task-count">3 tasks</span>
      </div>
      <ul className="demo-task-list">
        {demoTasks.map((task) => (
          <li key={task.title} className="demo-task-row">
            <span className="demo-task-bullet" aria-hidden="true" />
            <span className="demo-task-copy">
              <span className="demo-task-title">{task.title}</span>
              <span className="demo-task-meta">{task.meta}</span>
            </span>
            <span className="demo-task-status">{task.status}</span>
          </li>
        ))}
      </ul>
      <p className="demo-note">These sample tasks are just for exploring Pace. Nothing is saved.</p>
    </section>
  )
}
