"use client"

import { useEffect, useRef, useState } from "react"
import { Activity, BookOpenCheck, Focus, Heart, House, Settings, Wifi } from "lucide-react"
import {
  deferOpenTasks,
  getDailyEnergyLimit,
  getDailyEnergyUsage,
  getDateKey,
  getDemoData,
  getDemoPresetData,
  isCrashGuardActive,
  isTaskComplete,
  parsePaceData,
  PACE_STORAGE_KEY,
  shiftDateKey,
  type CompletionFeeling,
  type PaceData,
  type PaceTask,
  type RestActivityType,
} from "@/components/pace-data"
import { PaceAssignments } from "@/components/pace-assignments"
import { PaceEnergyPicker, type EnergyLevel } from "@/components/pace-energy-picker"
import { PaceFocusMode } from "@/components/pace-focus-mode"
import { PaceLowPowerChecklist } from "@/components/pace-low-power-checklist"
import { PaceOnboarding } from "@/components/pace-onboarding"
import { PacePacingSummary } from "@/components/pace-pacing-summary"
import { PaceRestActivities } from "@/components/pace-rest-activities"
import { PaceSettings } from "@/components/pace-settings"
import { PaceSymptomTracker } from "@/components/pace-symptom-tracker"
import { PaceTaskManager } from "@/components/pace-task-manager"
import { PaceTaskReflection } from "@/components/pace-task-reflection"

type PaceTab = "today" | "tasks" | "patterns" | "focus" | "settings"

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

function splitEffort(effort: PaceTask["effort"]): PaceTask["effort"] {
  return effort === "high" ? "medium" : "low"
}

function getTaskPartName(name: string, part: "one" | "two") {
  const baseName = name.replace(/^Part (?:one|two):\s*/i, "")
  return `Part ${part}: ${baseName}`
}

export function PaceApp() {
  const [data, setData] = useState<PaceData>(() => getDemoData())
  const [storageReady, setStorageReady] = useState(false)
  const [storageWarning, setStorageWarning] = useState(false)
  const [activeTab, setActiveTab] = useState<PaceTab>("today")
  const [taskFeedback, setTaskFeedback] = useState("")
  const [completionFeedback, setCompletionFeedback] = useState("")
  const [pendingReviewTask, setPendingReviewTask] = useState<PaceTask | null>(null)
  const [lastDeleted, setLastDeleted] = useState<{ task: PaceTask; index: number } | null>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const today = getDateKey()
  const guardActive = isCrashGuardActive(data, today)
  const lowPowerMode = data.energy === "drained"
  const safeLimit = getDailyEnergyLimit(data.energy, guardActive, data.profile.safeDailyLimit)
  const { used: energyUsed } = getDailyEnergyUsage(data.tasks, data.taskReviews, data.restActivities, today)
  const remainingEnergy = Math.max(0, safeLimit - energyUsed)
  const visibleTasks = lowPowerMode
    ? data.tasks.filter((task) => task.dueDate <= today || task.completedOn === today)
    : data.tasks

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
    if (energy === "drained") setActiveTab("today")
    setCompletionFeedback("")
    setTaskFeedback("")
  }

  function loadDemoPreset(preset: "finals" | "crash") {
    const next = getDemoPresetData(preset)
    setData((current) => ({ ...next, profile: { ...current.profile, onboardingComplete: true } }))
    setActiveTab("today")
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" })
    setCompletionFeedback("")
    setTaskFeedback("")
    setPendingReviewTask(null)
    setLastDeleted(null)
  }

  function toggleComplete(taskId: string) {
    const currentDay = getDateKey()
    const task = data.tasks.find((item) => item.id === taskId)
    if (!task) return

    if (isTaskComplete(task)) {
      setData((current) => ({
        ...current,
        tasks: current.tasks.map((item) => item.id === taskId ? { ...item, completedOn: undefined } : item),
        taskReviews: current.taskReviews.filter((review) => !(review.taskId === taskId && review.date === currentDay)),
      }))
      setPendingReviewTask(null)
      setCompletionFeedback("Back on your list. No pressure.")
      return
    }

    setData((current) => ({
      ...current,
      tasks: current.tasks.map((item) => item.id === taskId ? { ...item, completedOn: currentDay } : item),
    }))
    setTaskFeedback("")
    setCompletionFeedback("")
    setPendingReviewTask(task)
  }

  function reviewTask(feeling: CompletionFeeling) {
    if (!pendingReviewTask) return
    const task = pendingReviewTask
    const currentDay = getDateKey()
    setData((current) => ({
      ...current,
      taskReviews: [
        ...current.taskReviews.filter((review) => !(review.taskId === task.id && review.date === currentDay)),
        { taskId: task.id, date: currentDay, taskType: task.taskType, feeling },
      ],
    }))
    const notes: Record<CompletionFeeling, string> = {
      easier: "Thanks for noticing. Today’s remaining plan has a little more room.",
      expected: "Thanks for checking in. The rest of today’s plan stays as it is.",
      harder: "Thanks for noticing. We’ve made more room in today’s plan.",
    }
    setCompletionFeedback(notes[feeling])
    setPendingReviewTask(null)
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

  function splitTask(taskId: string) {
    const currentDay = getDateKey()
    setData((current) => {
      const target = current.tasks.find((task) => task.id === taskId)
      if (!target) return current
      const firstMinutes = Math.max(5, Math.ceil(target.estimatedMinutes / 2 / 5) * 5)
      const secondMinutes = Math.max(5, target.estimatedMinutes - firstMinutes)
      const partEffort = splitEffort(target.effort)
      const firstPart: PaceTask = {
        ...target,
        name: getTaskPartName(target.name, "one"),
        effort: partEffort,
        estimatedMinutes: firstMinutes,
        plannedDate: currentDay,
      }
      const secondPart: PaceTask = {
        ...target,
        id: createId(),
        name: getTaskPartName(target.name, "two"),
        effort: partEffort,
        estimatedMinutes: secondMinutes,
        plannedDate: shiftDateKey(currentDay, 1),
        completedOn: undefined,
      }
      return { ...current, tasks: current.tasks.flatMap((task) => task.id === taskId ? [firstPart, secondPart] : [task]) }
    })
    setTaskFeedback("We split it into a small part today and a rest for tomorrow.")
    setCompletionFeedback("")
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

  function addRest(activity: RestActivityType, points: number) {
    setData((current) => ({
      ...current,
      restActivities: [
        ...current.restActivities,
        { id: createId(), activity, points, date: getDateKey() },
      ],
    }))
  }

  function updateProfile(profile: PaceData["profile"]) {
    setData((current) => ({ ...current, profile }))
  }

  function finishOnboarding(profile: PaceData["profile"]) {
    setData((current) => ({ ...current, profile: { ...current.profile, ...profile } }))
    setActiveTab("today")
  }

  const tabs: Array<{ id: PaceTab; label: string; icon: typeof House }> = [
    { id: "today", label: "Today", icon: House },
    { id: "tasks", label: "Assignments", icon: BookOpenCheck },
    { id: "patterns", label: "Patterns", icon: Activity },
    { id: "focus", label: "Focus", icon: Focus },
  ]

  return (
    <div className="pace-stage">
      <div className="phone-shell">
        <div
          className={`phone-screen${lowPowerMode ? " is-low-power" : ""}${data.profile.dyslexiaFont ? " has-dyslexia-font" : ""}${data.profile.highContrast ? " is-high-contrast" : ""}${data.profile.reducedMotion ? " is-reduced-motion" : ""}`}
          data-theme={data.profile.theme}
          style={{ "--pace-text-scale": data.profile.textScale } as React.CSSProperties}
        >
          <div className="phone-status" aria-hidden="true">
            <span className="status-time">9:41</span>
            <span className="status-icons"><span className="signal-bars"><i /><i /><i /><i /></span><Wifi /><span className="status-battery"><i /></span></span>
          </div>

          <header className="app-header">
            <a className="brand-lockup" href="#today" aria-label="Pace home" onClick={() => setActiveTab("today")}>
              <img src="/pace-logo.png" alt="Pace" className="brand-logo" />
            </a>
            {storageReady && data.profile.onboardingComplete && (
              <button className={`settings-open${activeTab === "settings" ? " is-active" : ""}`} type="button" aria-label={activeTab === "settings" ? "Return to today" : "Open settings"} onClick={() => setActiveTab(activeTab === "settings" ? "today" : "settings")}>
                <Settings aria-hidden="true" />
              </button>
            )}
          </header>

          {storageWarning && <p className="storage-warning" role="alert">Browser storage is unavailable, so changes may not stay after you close this page.</p>}

          <main className="app-scroll" id="today" ref={scrollRef}>
            {!storageReady ? (
              <div className="pace-loading" role="status">Opening your space…</div>
            ) : !data.profile.onboardingComplete ? (
              <PaceOnboarding profile={data.profile} onComplete={finishOnboarding} />
            ) : activeTab === "settings" ? (
              <PaceSettings profile={data.profile} onChange={updateProfile} />
            ) : activeTab === "today" ? (
              <div className="today-view">
                <section className="welcome-copy" aria-labelledby="welcome-heading">
                  <p className="welcome-kicker">YOUR DAY, YOUR PACE</p>
                  <h1 id="welcome-heading">Productivity that fits your battery.</h1>
                  <p className="welcome-description">{data.profile.name ? `A gentle plan for you, ${data.profile.name}.` : "A school plan shaped around how you feel today — not the other way around."}</p>
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
                  <div className="demo-presets" aria-label="Try a sample day">
                    <button type="button" onClick={() => loadDemoPreset("finals")}>Try as: finals week</button>
                    <button type="button" onClick={() => loadDemoPreset("crash")}>Try as: crash day</button>
                  </div>
                </section>

                {lowPowerMode ? (
                  <aside className="low-power-note" role="status">
                    <Heart aria-hidden="true" />
                    <div><strong>Low Power mode is on.</strong><p>Only tasks due today are shown. Everything else can wait.</p></div>
                  </aside>
                ) : guardActive && (
                  <aside className="crash-guard" role="status" aria-live="polite">
                    <span className="crash-guard-icon"><Heart aria-hidden="true" /></span>
                    <div>
                      <strong>Let’s make today smaller.</strong>
                      <p>A stronger symptom day is a good reason to pause.</p>
                      <span>Open tasks moved to tomorrow. Due dates stay the same.</span>
                    </div>
                  </aside>
                )}

                <PacePacingSummary tasks={data.tasks} energy={data.energy} guardActive={guardActive} today={today} safeDailyLimit={data.profile.safeDailyLimit} reviews={data.taskReviews} restActivities={data.restActivities} />
                <PaceRestActivities activities={data.restActivities} today={today} onAdd={addRest} />
                {taskFeedback && <p className="today-feedback" role="status">{taskFeedback}</p>}
                {completionFeedback && <p className="today-feedback" role="status">{completionFeedback}</p>}
                {lowPowerMode ? (
                  <PaceLowPowerChecklist tasks={data.tasks} today={today} remainingEnergy={remainingEnergy} onToggleComplete={toggleComplete} onSplitTask={splitTask} />
                ) : (
                  <PaceAssignments
                    tasks={data.tasks}
                    energy={data.energy}
                    guardActive={guardActive}
                    today={today}
                    remainingEnergy={remainingEnergy}
                    onToggleComplete={toggleComplete}
                    onSplitTask={splitTask}
                  />
                )}
                <p className="energy-reserve-note">Pace always keeps some energy in reserve, so your plan never goes to zero.</p>
              </div>
            ) : activeTab === "tasks" ? (
              <div className="tasks-view">
                <section className="view-intro" aria-labelledby="tasks-view-heading">
                  <p className="welcome-kicker">MAKE THE LIST YOURS</p>
                  <h1 id="tasks-view-heading">A plan that can bend.</h1>
                  <p>Move, edit, or let a task wait. It’s your list.</p>
                </section>
                {lowPowerMode ? (
                  <PaceLowPowerChecklist tasks={visibleTasks} today={today} remainingEnergy={remainingEnergy} onToggleComplete={toggleComplete} onSplitTask={splitTask} />
                ) : guardActive && (
                  <aside className="crash-guard compact-guard" role="status">
                    <span className="crash-guard-icon"><Heart aria-hidden="true" /></span>
                    <div><strong>Today has more room for rest.</strong><p>Open tasks are set for tomorrow. Their due dates haven’t changed.</p></div>
                  </aside>
                )}
                {!lowPowerMode && <PaceTaskManager
                  tasks={visibleTasks}
                  today={today}
                  subjects={data.profile.subjects}
                  feedback={taskFeedback}
                  completionFeedback={completionFeedback}
                  undoTaskName={lastDeleted?.task.name}
                  onSave={saveTask}
                  onToggleComplete={toggleComplete}
                  onMove={moveTask}
                  onDelete={deleteTask}
                  onUndoDelete={undoDelete}
                />}
              </div>
            ) : activeTab === "patterns" ? (
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
                  tasks={data.tasks}
                  taskReviews={data.taskReviews}
                  today={today}
                  onLog={logSymptom}
                  onAddCustom={addCustomSymptom}
                  onRemove={removeSymptom}
                />
              </div>
            ) : (
              <PaceFocusMode tasks={data.tasks} energy={data.energy} onCompleteTask={toggleComplete} />
            )}

            {storageReady && data.profile.onboardingComplete && activeTab !== "settings" && !lowPowerMode && (
              <>
                <aside className="support-note" id="rest-note" aria-label="A note about your wellbeing">
                  <Heart aria-hidden="true" />
                  <p><strong>Your body gets a say.</strong> Pace is a planning demo, not medical advice. Your care team knows your needs best.</p>
                </aside>
                <p className="end-note">Made for days that don’t fit a straight line.</p>
              </>
            )}
          </main>

          {storageReady && data.profile.onboardingComplete && (
            <nav className={`bottom-nav${lowPowerMode ? " is-low-power" : ""}`} aria-label="Main navigation">
              {tabs.filter(({ id }) => !lowPowerMode || (id !== "patterns" && id !== "focus")).map(({ id, label, icon: Icon }) => (
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
          )}

          {pendingReviewTask && <PaceTaskReflection taskName={pendingReviewTask.name} onChoose={reviewTask} onSkip={() => setPendingReviewTask(null)} />}
        </div>
      </div>
    </div>
  )
}
