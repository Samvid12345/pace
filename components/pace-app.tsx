"use client"

import { useEffect, useRef, useState } from "react"
import { Activity, BookOpenCheck, Heart, House, Wifi } from "lucide-react"
import {
  deferOpenTasks,
  getDateKey,
  getDemoData,
  isCrashGuardActive,
  parsePaceData,
  PACE_STORAGE_KEY,
  shiftDateKey,
  type PaceData,
  type PaceTask,
} from "@/components/pace-data"
import { PaceAssignments } from "@/components/pace-assignments"
import { PaceEnergyPicker, type EnergyLevel } from "@/components/pace-energy-picker"
import { PacePacingSummary } from "@/components/pace-pacing-summary"
import { PaceSymptomTracker } from "@/components/pace-symptom-tracker"
import { PaceTaskManager } from "@/components/pace-task-manager"

type PaceTab = "today" | "tasks" | "patterns"

const energyNotes: Record<EnergyLevel, string> = {
  drained: "Thanks for checking in. We’ll make room for rest first.",
  low: "Low is useful information. We’ll keep this small.",
  okay: "We’ll make a steady plan with space to pause.",
  charged: "We’ll use a little energy without spending it all.",
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `pace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function PaceApp() {
  const [data, setData] = useState<PaceData>(() => getDemoData())
  const [storageReady, setStorageReady] = useState(false)
  const [storageWarning, setStorageWarning] = useState(false)
  const [activeTab, setActiveTab] = useState<PaceTab>("today")
  const [taskFeedback, setTaskFeedback] = useState("")
  const [completionFeedback, setCompletionFeedback] = useState("")
  const [lastDeleted, setLastDeleted] = useState<{ task: PaceTask; index: number } | null>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const today = getDateKey()
  const guardActive = isCrashGuardActive(data, today)

  useEffect(() => {
    try {
      const saved = parsePaceData(window.localStorage.getItem(PACE_STORAGE_KEY))
      if (saved) {
        const needsDeferral = isCrashGuardActive(saved, getDateKey())
        setData({
          ...saved,
          tasks: needsDeferral ? deferOpenTasks(saved.tasks, getDateKey()) : saved.tasks,
        })
      }
    } catch {
      setStorageWarning(true)
    }
    setStorageReady(true)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" })
  }, [activeTab])

  useEffect(() => {
    if (!storageReady) return
    try {
      window.localStorage.setItem(PACE_STORAGE_KEY, JSON.stringify(data))
      setStorageWarning(false)
    } catch {
      setStorageWarning(true)
    }
  }, [data, storageReady])

  function changeEnergy(energy: EnergyLevel) {
    const currentDay = getDateKey()
    setData((current) => {
      const energyHistory = current.energyHistory.filter((day) => day.date !== currentDay)
      energyHistory.push({ date: currentDay, level: energy })
      return {
        ...current,
        energy,
        energyHistory,
        tasks: energy === "drained" ? deferOpenTasks(current.tasks, currentDay) : current.tasks,
      }
    })
    setCompletionFeedback("")
    setTaskFeedback("")
  }

  function toggleComplete(taskId: string) {
    const currentDay = getDateKey()
    const task = data.tasks.find((item) => item.id === taskId)
    const willComplete = !task?.completedOn
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((item) => item.id === taskId
        ? { ...item, completedOn: item.completedOn ? undefined : currentDay }
        : item),
    }))
    setTaskFeedback("")
    setCompletionFeedback(willComplete ? "nice, that counted." : "Back on your list. No pressure.")
  }

  function saveTask(draft: Omit<PaceTask, "id" | "plannedDate" | "completedOn">, taskId?: string) {
    const currentDay = getDateKey()
    setData((current) => {
      if (taskId) {
        return {
          ...current,
          tasks: current.tasks.map((task) => task.id === taskId ? { ...task, ...draft } : task),
        }
      }

      const shouldDefer = isCrashGuardActive(current, currentDay)
      const task: PaceTask = {
        ...draft,
        id: createId(),
        plannedDate: shouldDefer ? shiftDateKey(currentDay, 1) : currentDay,
      }
      return { ...current, tasks: [...current.tasks, task] }
    })
    setTaskFeedback(taskId ? "Task updated." : "Task added to your list.")
    setCompletionFeedback("")
    setLastDeleted(null)
  }

  function moveTask(taskId: string, direction: -1 | 1) {
    setData((current) => {
      const tasks = [...current.tasks]
      const index = tasks.findIndex((task) => task.id === taskId)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= tasks.length) return current
      ;[tasks[index], tasks[nextIndex]] = [tasks[nextIndex], tasks[index]]
      return { ...current, tasks }
    })
  }

  function deleteTask(taskId: string) {
    const index = data.tasks.findIndex((task) => task.id === taskId)
    if (index < 0) return
    const task = data.tasks[index]
    setLastDeleted({ task, index })
    setData((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== taskId) }))
    setTaskFeedback("")
    setCompletionFeedback("")
  }

  function undoDelete() {
    if (!lastDeleted) return
    setData((current) => {
      const tasks = [...current.tasks]
      tasks.splice(Math.min(lastDeleted.index, tasks.length), 0, lastDeleted.task)
      return { ...current, tasks }
    })
    setLastDeleted(null)
    setTaskFeedback("Task restored.")
  }

  function logSymptom(symptom: string, severity: number, note: string) {
    const currentDay = getDateKey()
    setData((current) => {
      const symptoms = [
        ...current.symptoms,
        { id: createId(), symptom, severity, note, date: currentDay, loggedAt: new Date().toISOString() },
      ]
      const next = { ...current, symptoms }
      return severity >= 4 ? { ...next, tasks: deferOpenTasks(current.tasks, currentDay) } : next
    })
  }

  function addCustomSymptom(symptom: string) {
    setData((current) => ({
      ...current,
      customSymptoms: current.customSymptoms.some((item) => item.toLowerCase() === symptom.toLowerCase())
        ? current.customSymptoms
        : [...current.customSymptoms, symptom],
    }))
  }

  function removeSymptom(entryId: string) {
    setData((current) => ({ ...current, symptoms: current.symptoms.filter((entry) => entry.id !== entryId) }))
  }

  const tabs: Array<{ id: PaceTab; label: string; icon: typeof House }> = [
    { id: "today", label: "Today", icon: House },
    { id: "tasks", label: "Assignments", icon: BookOpenCheck },
    { id: "patterns", label: "Patterns", icon: Activity },
  ]

  return (
    <div className="pace-stage">
      <div className="phone-shell">
        <div className="phone-screen">
          <div className="phone-status" aria-hidden="true">
            <span className="status-time">9:41</span>
            <span className="status-icons"><span className="signal-bars"><i /><i /><i /><i /></span><Wifi /><span className="status-battery"><i /></span></span>
          </div>

          <header className="app-header">
            <a className="brand-lockup" href="#today" aria-label="Pace home" onClick={() => setActiveTab("today")}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-9s6WfuaGwFsrNYk1yi8m6yP0kUv5wm.png"
                alt="Pace"
                className="brand-logo"
              />
            </a>
            <span className="demo-badge"><span />Demo</span>
          </header>

          {storageWarning && <p className="storage-warning" role="alert">Browser storage is unavailable, so changes may not stay after you close this page.</p>}

          <main className="app-scroll" id="today" ref={scrollRef}>
            {activeTab === "today" && (
              <div className="today-view">
                <section className="welcome-copy" aria-labelledby="welcome-heading">
                  <p className="welcome-kicker">YOUR DAY, YOUR PACE</p>
                  <h1 id="welcome-heading">Productivity that fits your battery.</h1>
                  <p className="welcome-description">A school plan shaped around how you feel today — not the other way around.</p>
                </section>

                <section className="energy-panel" aria-labelledby="energy-heading">
                  <div className="energy-heading-row">
                    <div>
                      <p className="section-kicker">A QUICK CHECK-IN</p>
                      <h2 id="energy-heading">How’s your energy?</h2>
                    </div>
                    <span className="energy-day-mark" aria-hidden="true"><span /></span>
                  </div>
                  <PaceEnergyPicker value={data.energy} onChange={changeEnergy} />
                  <p className="energy-note" aria-live="polite">{energyNotes[data.energy]}</p>
                </section>

                {guardActive && (
                  <aside className="crash-guard" role="status" aria-live="polite">
                    <span className="crash-guard-icon"><Heart aria-hidden="true" /></span>
                    <div>
                      <strong>Let’s make today smaller.</strong>
                      <p>{data.energy === "drained" ? "Drained is enough information to make room for rest." : "A stronger symptom day is a good reason to pause."}</p>
                      <span>Open tasks moved to tomorrow. Due dates stay the same.</span>
                    </div>
                  </aside>
                )}

                <PacePacingSummary tasks={data.tasks} energy={data.energy} guardActive={guardActive} today={today} />
                {completionFeedback && <p className="today-feedback" role="status">{completionFeedback}</p>}
                <PaceAssignments
                  tasks={data.tasks}
                  energy={data.energy}
                  guardActive={guardActive}
                  today={today}
                  onToggleComplete={toggleComplete}
                />
                <p className="today-end-note">Your energy is information, not a promise.</p>
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="tasks-view">
                <section className="view-intro" aria-labelledby="tasks-view-heading">
                  <p className="welcome-kicker">MAKE THE LIST YOURS</p>
                  <h1 id="tasks-view-heading">A plan that can bend.</h1>
                  <p>Move, edit, or let a task wait. It’s your list.</p>
                </section>
                {guardActive && (
                  <aside className="crash-guard compact-guard" role="status">
                    <span className="crash-guard-icon"><Heart aria-hidden="true" /></span>
                    <div><strong>Today has more room for rest.</strong><p>Open tasks are set for tomorrow. Their due dates haven’t changed.</p></div>
                  </aside>
                )}
                <PaceTaskManager
                  tasks={data.tasks}
                  today={today}
                  feedback={taskFeedback}
                  completionFeedback={completionFeedback}
                  undoTaskName={lastDeleted?.task.name}
                  onSave={saveTask}
                  onToggleComplete={toggleComplete}
                  onMove={moveTask}
                  onDelete={deleteTask}
                  onUndoDelete={undoDelete}
                />
              </div>
            )}

            {activeTab === "patterns" && (
              <div className="patterns-view">
                <section className="view-intro" aria-labelledby="patterns-view-heading">
                  <p className="welcome-kicker">NOTICE, DON’T JUDGE</p>
                  <h1 id="patterns-view-heading">How has your body felt?</h1>
                  <p>Small notes can make patterns easier to spot.</p>
                </section>
                <PaceSymptomTracker
                  symptoms={data.symptoms}
                  customSymptoms={data.customSymptoms}
                  energyHistory={data.energyHistory}
                  today={today}
                  onLog={logSymptom}
                  onAddCustom={addCustomSymptom}
                  onRemove={removeSymptom}
                />
              </div>
            )}

            <aside className="support-note" id="rest-note" aria-label="A note about your wellbeing">
              <Heart aria-hidden="true" />
              <p><strong>Your body gets a say.</strong> Pace is a planning demo, not medical advice. Your care team knows your needs best.</p>
            </aside>
            <p className="end-note">Made for days that don’t fit a straight line.</p>
          </main>

          <nav className="bottom-nav" aria-label="Main navigation">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                className={`nav-item${activeTab === id ? " is-active" : ""}`}
                type="button"
                key={id}
                aria-current={activeTab === id ? "page" : undefined}
                aria-pressed={activeTab === id}
                onClick={() => setActiveTab(id)}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
