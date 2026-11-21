"use client"

import { ArrowLeft, ArrowRight, Heart } from "lucide-react"
import { useState } from "react"
import { conditionOptions, type PaceProfile } from "@/components/pace-data"

interface PaceOnboardingProps {
  profile: PaceProfile
  onComplete: (profile: PaceProfile) => void
}

const stepTitles = ["What should Pace keep in mind?", "What subjects are on your list?", "What feels like a safe daily limit?"]

export function PaceOnboarding({ profile, onComplete }: PaceOnboardingProps) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<PaceProfile>(profile)
  const [subjectDraft, setSubjectDraft] = useState(profile.subjects.join(", "))

  function toggleCondition(condition: string) {
    setDraft((current) => ({
      ...current,
      conditions: current.conditions.includes(condition)
        ? current.conditions.filter((item) => item !== condition)
        : [...current.conditions, condition],
    }))
  }

  function saveSubjects() {
    const subjects = subjectDraft.split(",").map((subject) => subject.trim()).filter(Boolean).slice(0, 20)
    setDraft((current) => ({ ...current, subjects }))
    setStep(2)
  }

  function finish() {
    onComplete({ ...draft, onboardingComplete: true })
  }

  return (
    <section className="onboarding-card" aria-labelledby="onboarding-heading">
      <span className="onboarding-mark" aria-hidden="true"><Heart /></span>
      <p className="section-kicker">A GENTLE START · {step + 1} OF 3</p>
      <div className="onboarding-progress" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1}>
        <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
      </div>
      <h1 id="onboarding-heading">{stepTitles[step]}</h1>
      <p className="onboarding-description">
        {step === 0 && "Share only what helps. Your choices stay in this browser."}
        {step === 1 && "A few subjects make your task list feel more like yours."}
        {step === 2 && "This is a planning guide, not a test or a promise."}
      </p>

      {step === 0 && (
        <fieldset className="onboarding-options">
          <legend>Choose any that feel useful</legend>
          {conditionOptions.map((condition) => (
            <label className="onboarding-option" key={condition}>
              <input type="checkbox" checked={draft.conditions.includes(condition)} onChange={() => toggleCondition(condition)} />
              <span>{condition}</span>
            </label>
          ))}
        </fieldset>
      )}

      {step === 1 && (
        <label className="pace-field onboarding-subject-field">
          <span>Subjects, separated by commas</span>
          <textarea rows={3} maxLength={240} value={subjectDraft} onChange={(event) => setSubjectDraft(event.target.value)} placeholder="Biology, History, Art" />
        </label>
      )}

      {step === 2 && (
        <div className="onboarding-limit">
          <div className="onboarding-limit-copy"><span>Your safe daily limit</span><strong>{draft.safeDailyLimit} points</strong></div>
          <input
            aria-label="Safe daily limit"
            type="range"
            min={20}
            max={100}
            step={5}
            value={draft.safeDailyLimit}
            onChange={(event) => setDraft((current) => ({ ...current, safeDailyLimit: Number(event.target.value) }))}
          />
          <div className="onboarding-limit-labels"><span>More room for rest</span><span>More room for tasks</span></div>
        </div>
      )}

      <div className="onboarding-actions">
        {step > 0 && (
          <button className="task-cancel-button" type="button" onClick={() => setStep((current) => current - 1)}>
            <ArrowLeft aria-hidden="true" /> Back
          </button>
        )}
        {step === 0 && (
          <button className="onboarding-explore" type="button" onClick={() => onComplete({ ...draft, onboardingComplete: true })}>
            Explore a demo instead
          </button>
        )}
        {step === 0 && (
          <button className="task-save-button" type="button" onClick={() => setStep(1)}>
            Continue <ArrowRight aria-hidden="true" />
          </button>
        )}
        {step === 1 && (
          <button className="task-save-button" type="button" onClick={saveSubjects}>
            Continue <ArrowRight aria-hidden="true" />
          </button>
        )}
        {step === 2 && (
          <button className="task-save-button" type="button" onClick={finish}>Finish setup</button>
        )}
      </div>
      <p className="onboarding-privacy">You can change any of this later in Settings.</p>
    </section>
  )
}
