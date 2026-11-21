"use client"

import { ExternalLink, Moon, Sun } from "lucide-react"
import { useState } from "react"
import { conditionOptions, type PaceProfile } from "@/components/pace-data"

interface PaceSettingsProps {
  profile: PaceProfile
  onChange: (profile: PaceProfile) => void
}

export function PaceSettings({ profile, onChange }: PaceSettingsProps) {
  const [subjectsDraft, setSubjectsDraft] = useState(profile.subjects.join(", "))

  function update<K extends keyof PaceProfile>(key: K, value: PaceProfile[K]) {
    onChange({ ...profile, [key]: value })
  }

  return (
    <div className="settings-view">
      <section className="view-intro" aria-labelledby="settings-heading">
        <p className="welcome-kicker">MAKE PACE FEEL LIKE YOURS</p>
        <h1 id="settings-heading">Settings</h1>
        <p>Small adjustments are always okay.</p>
      </section>

      <section className="settings-card" aria-labelledby="profile-settings-heading">
        <div className="settings-card-heading">
          <span className="section-kicker">YOUR SPACE</span>
          <h2 id="profile-settings-heading">A little about you</h2>
        </div>
        <label className="pace-field settings-name-field">
          <span>Your name</span>
          <input maxLength={48} value={profile.name} onChange={(event) => update("name", event.target.value)} placeholder="What should Pace call you?" />
        </label>
        <label className="pace-field settings-subject-field">
          <span>Subjects, separated by commas</span>
          <input
            maxLength={240}
            value={subjectsDraft}
            onChange={(event) => setSubjectsDraft(event.target.value)}
            onBlur={() => update("subjects", subjectsDraft.split(",").map((subject) => subject.trim()).filter(Boolean).slice(0, 20))}
            placeholder="Biology, History, Art"
          />
        </label>
        <fieldset className="settings-conditions">
          <legend>Conditions Pace can keep in mind</legend>
          <p>Optional. These stay in this browser.</p>
          <div className="settings-condition-options">
            {conditionOptions.map((condition) => (
              <label className="settings-condition-option" key={condition}>
                <input
                  type="checkbox"
                  checked={profile.conditions.includes(condition)}
                  onChange={() => update("conditions", profile.conditions.includes(condition)
                    ? profile.conditions.filter((item) => item !== condition)
                    : [...profile.conditions, condition])}
                />
                <span>{condition}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="settings-control-row">
          <div className="settings-control-copy">
            <strong>Appearance</strong>
            <span>Choose a softer light or dark view.</span>
          </div>
          <div className="theme-options" role="group" aria-label="Color theme">
            <button type="button" aria-pressed={profile.theme === "light"} onClick={() => update("theme", "light")}>
              <Sun aria-hidden="true" /> Light
            </button>
            <button type="button" aria-pressed={profile.theme === "dark"} onClick={() => update("theme", "dark")}>
              <Moon aria-hidden="true" /> Dark
            </button>
          </div>
        </div>
        <label className="settings-limit-control">
          <span><strong>Safe daily limit</strong><strong>{profile.safeDailyLimit} points</strong></span>
          <input type="range" min={20} max={100} step={5} value={profile.safeDailyLimit} onChange={(event) => update("safeDailyLimit", Number(event.target.value))} />
        </label>
      </section>

      <section className="settings-card" aria-labelledby="accessibility-heading">
        <div className="settings-card-heading">
          <span className="section-kicker">COMFORT & ACCESSIBILITY</span>
          <h2 id="accessibility-heading">Reading and motion</h2>
        </div>
        <label className="settings-toggle-row">
          <span><strong>Dyslexia-friendly font</strong><small>Use Atkinson Hyperlegible for easier letter distinction.</small></span>
          <input type="checkbox" checked={profile.dyslexiaFont} onChange={(event) => update("dyslexiaFont", event.target.checked)} />
        </label>
        <label className="settings-toggle-row">
          <span><strong>High contrast</strong><small>Strengthen text, borders, and focus indicators.</small></span>
          <input type="checkbox" checked={profile.highContrast} onChange={(event) => update("highContrast", event.target.checked)} />
        </label>
        <label className="settings-toggle-row">
          <span><strong>Reduced motion</strong><small>Keep the breathing pacer still and transitions minimal.</small></span>
          <input type="checkbox" checked={profile.reducedMotion} onChange={(event) => update("reducedMotion", event.target.checked)} />
        </label>
        <label className="settings-limit-control text-size-control">
          <span><strong>Text size</strong><strong>{Math.round(profile.textScale * 100)}%</strong></span>
          <input aria-label="Text size" type="range" min={0.9} max={1.3} step={0.1} value={profile.textScale} onChange={(event) => update("textScale", Number(event.target.value))} />
          <small>Adjust the Today and task screens to a comfortable size.</small>
        </label>
      </section>

      <section className="settings-card about-card" aria-labelledby="about-heading">
        <div className="settings-card-heading">
          <span className="section-kicker">ABOUT PACE</span>
          <h2 id="about-heading">A note on energy</h2>
        </div>
        <p>Pace is inspired by spoon theory, a way to describe limited energy and the choices that come with it, shared by Christine Miserandino.</p>
        <a className="spoon-theory-link" href="https://butyoudontlooksick.com/articles/written-by-christine/the-spoon-theory/" target="_blank" rel="noreferrer">
          Read Christine Miserandino&apos;s original essay <ExternalLink aria-hidden="true" />
        </a>
        <details className="capybara-surprise">
          <summary>A tiny rest-day surprise</summary>
          <img src="/capybara-rest.png" alt="A small capybara resting on a cushion beside an orange." width={180} height={180} />
          <p>Rest belongs in the plan, too.</p>
        </details>
        <p className="local-save-note">Your profile and preferences stay in this browser on this device.</p>
      </section>
    </div>
  )
}
