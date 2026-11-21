"use client"

import { useState } from "react"
import { BookOpen, Heart, House, Wifi } from "lucide-react"
import { PaceEnergyPicker, type EnergyLevel } from "@/components/pace-energy-picker"
import { DemoTaskList, PacePlan } from "@/components/pace-plan"

const energyNotes: Record<EnergyLevel, string> = {
  drained: "Thanks for checking in. We’ll make room for rest first.",
  low: "Low is useful information. We’ll keep this small.",
  okay: "We’ll make a steady plan with space to pause.",
  charged: "We’ll use a little energy without spending it all.",
}

export function PaceApp() {
  const [energy, setEnergy] = useState<EnergyLevel>("low")
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  function toggleComplete(taskId: string) {
    setCompleted((current) => ({ ...current, [taskId]: !current[taskId] }))
  }

  return (
    <div className="pace-stage">
      <div className="phone-shell">
        <div className="phone-screen">
          <div className="phone-status" aria-hidden="true">
            <span className="status-time">9:41</span>
            <span className="status-icons"><span className="signal-bars"><i /><i /><i /><i /></span><Wifi /><span className="status-battery"><i /></span></span>
          </div>

          <header className="app-header">
            <a className="brand-lockup" href="#today" aria-label="Pace home">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-9s6WfuaGwFsrNYk1yi8m6yP0kUv5wm.png"
                alt="Pace"
                className="brand-logo"
              />
            </a>
            <span className="demo-badge"><span />Demo</span>
          </header>

          <main className="app-scroll" id="today">
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
              <PaceEnergyPicker value={energy} onChange={setEnergy} />
              <p className="energy-note" aria-live="polite">{energyNotes[energy]}</p>
            </section>

            <PacePlan energy={energy} completed={completed} onToggleComplete={toggleComplete} />
            <DemoTaskList />

            <aside className="support-note" aria-label="A note about your wellbeing">
              <Heart aria-hidden="true" />
              <p><strong>Your body gets a say.</strong> Pace is a planning demo, not medical advice. Your care team knows your needs best.</p>
            </aside>
            <p className="end-note">Made for days that don’t fit a straight line.</p>
          </main>

          <nav className="bottom-nav" aria-label="Main navigation">
            <a className="nav-item is-active" href="#today" aria-current="page">
              <House aria-hidden="true" />
              <span>Today</span>
            </a>
            <a className="nav-item" href="#school-plan">
              <BookOpen aria-hidden="true" />
              <span>School plan</span>
            </a>
            <a className="nav-item" href="#rest-note">
              <Heart aria-hidden="true" />
              <span>Rest note</span>
            </a>
          </nav>
        </div>
      </div>
    </div>
  )
}
