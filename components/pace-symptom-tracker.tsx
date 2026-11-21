"use client"

import { Activity, Plus, Trash2 } from "lucide-react"
import { useMemo, useState, type FormEvent } from "react"
import { shiftDateKey, symptomOptions, type EnergyDay, type SymptomEntry } from "@/components/pace-data"
import type { EnergyLevel } from "@/components/pace-energy-picker"

interface PaceSymptomTrackerProps {
  symptoms: SymptomEntry[]
  customSymptoms: string[]
  energyHistory: EnergyDay[]
  today: string
  onLog: (symptom: string, severity: number, note: string) => void
  onAddCustom: (symptom: string) => void
  onRemove: (entryId: string) => void
}

const energyHeight: Record<EnergyLevel, number> = {
  drained: 18,
  low: 38,
  okay: 62,
  charged: 88,
}

const energyRank: Record<EnergyLevel, number> = {
  drained: 0,
  low: 1,
  okay: 2,
  charged: 3,
}

function findPattern(days: Array<{ date: string; level?: EnergyLevel; maxSeverity: number }>) {
  for (let index = 1; index < days.length; index += 1) {
    const previous = days[index - 1]
    const current = days[index]
    if (
      previous.level &&
      current.level &&
      energyRank[previous.level] >= 2 &&
      energyRank[previous.level] - energyRank[current.level] >= 2 &&
      current.maxSeverity >= 4
    ) {
      const date = new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date(`${current.date}T12:00:00`))
      return `After a higher-energy day, you logged more symptoms on ${date}. Just a pattern to notice, not a rule.`
    }
  }
  return null
}

function WeeklyPattern({ symptoms, energyHistory, today }: Pick<PaceSymptomTrackerProps, "symptoms" | "energyHistory" | "today">) {
  const week = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = shiftDateKey(today, index - 6)
      const entries = symptoms.filter((entry) => entry.date === date)
      const history = energyHistory.find((day) => day.date === date)
      return {
        date,
        level: history?.level,
        count: entries.length,
        maxSeverity: entries.reduce((maximum, entry) => Math.max(maximum, entry.severity), 0),
        labels: entries.map((entry) => `${entry.symptom}, severity ${entry.severity}`).join("; "),
      }
    })
  }, [energyHistory, symptoms, today])
  const pattern = findPattern(week)

  return (
    <section className="weekly-pattern" aria-labelledby="weekly-heading">
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">A LITTLE CONTEXT</p>
          <h2 id="weekly-heading">Your last 7 days</h2>
        </div>
        <span className="week-mark"><Activity aria-hidden="true" /></span>
      </div>
      <p className="section-intro">A gentle look at energy and symptoms together.</p>
      <div className="chart-legend" aria-hidden="true">
        <span><i className="legend-battery" />Battery</span>
        <span><i className="legend-symptoms" />Highest symptom severity</span>
      </div>
      <div
        className="week-chart"
        role="img"
        aria-label={week.map((day) => {
          const label = new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric" }).format(new Date(`${day.date}T12:00:00`))
          return `${label}: battery ${day.level ?? "not logged"}; ${day.count} symptom logs, highest severity ${day.maxSeverity || "none"}`
        }).join(". ")}
      >
        {week.map((day) => {
          const weekday = new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${day.date}T12:00:00`))
          const isToday = day.date === today
          return (
            <div className={`week-day${isToday ? " is-today" : ""}`} key={day.date}>
              <span className="week-day-label">{isToday ? "Today" : weekday}</span>
              <div className="week-bars" aria-hidden="true">
                <span className={`week-bar battery-bar battery-${day.level ?? "empty"}`} style={{ height: `${day.level ? energyHeight[day.level] : 5}%` }} />
                <span className={`week-bar symptom-bar${day.maxSeverity ? " has-symptom" : ""}`} style={{ height: `${day.maxSeverity ? day.maxSeverity * 20 : 5}%` }} />
              </div>
              <span className="week-energy-label">{day.level ? day.level.slice(0, 3) : "—"}</span>
              <span className="week-symptom-label">
                {day.count > 0 ? `${day.count} log${day.count === 1 ? "" : "s"} · ${day.maxSeverity}/5` : "No logs"}
              </span>
            </div>
          )
        })}
      </div>
      {pattern && <p className="pattern-note" role="note">{pattern}</p>}
      <p className="chart-caption">Your energy and notes are personal signals, not a score or prediction.</p>
    </section>
  )
}

export function PaceSymptomTracker({
  symptoms,
  customSymptoms,
  energyHistory,
  today,
  onLog,
  onAddCustom,
  onRemove,
}: PaceSymptomTrackerProps) {
  const [selectedSymptom, setSelectedSymptom] = useState("Fatigue")
  const [severity, setSeverity] = useState(3)
  const [note, setNote] = useState("")
  const [customDraft, setCustomDraft] = useState("")
  const [feedback, setFeedback] = useState("")
  const options = [...symptomOptions, ...customSymptoms]
  const todayEntries = symptoms
    .filter((entry) => entry.date === today)
    .sort((first, second) => second.loggedAt.localeCompare(first.loggedAt))

  function handleLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onLog(selectedSymptom, severity, note.trim())
    setNote("")
    setFeedback(`${selectedSymptom} logged. Thanks for checking in.`)
  }

  function handleAddCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = customDraft.trim()
    if (!value || options.some((option) => option.toLowerCase() === value.toLowerCase())) return
    onAddCustom(value)
    setSelectedSymptom(value)
    setCustomDraft("")
    setFeedback(`${value} is ready to log.`)
  }

  return (
    <div className="symptom-page">
      <section className="symptom-entry-card" aria-labelledby="symptoms-heading">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">A QUICK BODY CHECK-IN</p>
            <h2 id="symptoms-heading">What are you noticing?</h2>
          </div>
          <span className="symptom-mark"><Activity aria-hidden="true" /></span>
        </div>
        <p className="section-intro">Choose one, set a number, and add a note only if it helps.</p>

        <form className="symptom-form" onSubmit={handleLog}>
          <fieldset className="symptom-fieldset">
            <legend>Choose a symptom</legend>
            <div className="symptom-options">
              {options.map((option) => (
                <button
                  className={`symptom-chip${selectedSymptom === option ? " is-selected" : ""}`}
                  type="button"
                  key={option}
                  aria-pressed={selectedSymptom === option}
                  onClick={() => setSelectedSymptom(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="symptom-fieldset severity-fieldset">
            <legend>How strong is it? <span>1 is mild · 5 is strong</span></legend>
            <div className="severity-options" role="group" aria-label="Symptom severity">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  className={`severity-option${severity === value ? " is-selected" : ""}`}
                  key={value}
                  aria-pressed={severity === value}
                  aria-label={`Severity ${value}${value === 1 ? ", mild" : value === 5 ? ", strong" : ""}`}
                  onClick={() => setSeverity(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="pace-field note-field">
            <span>Anything you want to remember? <em>Optional</em></span>
            <textarea
              maxLength={180}
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="A little context, if useful"
            />
          </label>
          <button className="task-save-button log-symptom-button" type="submit">Log {selectedSymptom.toLowerCase()}</button>
          {feedback && <p className="symptom-feedback" role="status">{feedback}</p>}
        </form>

        <details className="custom-symptom-details">
          <summary><Plus aria-hidden="true" /> Add your own symptom</summary>
          <form className="custom-symptom-form" onSubmit={handleAddCustom}>
            <label className="pace-field">
              <span>Symptom name</span>
              <input
                maxLength={28}
                value={customDraft}
                onChange={(event) => setCustomDraft(event.target.value)}
                placeholder="e.g., light sensitivity"
              />
            </label>
            <button className="custom-symptom-add" type="submit" disabled={!customDraft.trim()}>Add</button>
          </form>
        </details>

        <div className="today-symptoms">
          <div className="today-symptoms-heading">
            <h3>Today, so far</h3>
            <span>{todayEntries.length} {todayEntries.length === 1 ? "note" : "notes"}</span>
          </div>
          {todayEntries.length > 0 ? (
            <ul className="symptom-log-list">
              {todayEntries.map((entry) => (
                <li className="symptom-log-row" key={entry.id}>
                  <span className="symptom-severity-dot" data-severity={entry.severity} aria-hidden="true" />
                  <div className="symptom-log-copy">
                    <strong>{entry.symptom} <span>{entry.severity}/5</span></strong>
                    {entry.note && <p>{entry.note}</p>}
                  </div>
                  <button type="button" aria-label={`Remove ${entry.symptom} log`} onClick={() => onRemove(entry.id)}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-symptoms">No notes yet today. You can leave it that way.</p>
          )}
        </div>
        <p className="local-save-note">Symptom notes are saved only in this browser, on this device.</p>
      </section>

      <WeeklyPattern symptoms={symptoms} energyHistory={energyHistory} today={today} />
    </div>
  )
}
