# Dr.-VR Guided Response: Opioid Overdose (Naloxone)

**Status:** Built, v0.1, ready to demo · **Last updated:** 2026-10-10 · **Owner:** Joshua Cheng

> Prototype, not a medical device. The medical steps come from published lay-rescuer guidance (listed under Sources). Check them against the current label before every demo.

---

## 1. What it is

**One-line pitch:** Once the kit lands, Dr.-VR talks a bystander with no training through recognizing an overdose, giving Narcan, and knowing when to give a second dose.

**How to describe it:** one feature, the guided emergency protocol engine, proven on one protocol, naloxone. The next protocols (CPR/AED, bleeding control, EpiPen) are new content files on the same engine. They are not new engineering.

**Where it fits in the product plan:** this is the "Guided Deployment of High-Consequence Countermeasures → Opioid Reversal" section of the planning doc:

| Planning doc item | In this demo |
|---|---|
| Visual guidance: highlight the kit bay holding the nasal spray | A static kit diagram with Bay 1 flashing |
| Administration prompts: head tilt and nasal spray steps | One screen per step, each with a diagram and spoken instruction |
| Dose interval tracking: 2–3 min timer, alert if a second dose is needed | A countdown timer, a check-in, and a second-dose alert |
| Voice-first interaction (answer to the doc's design question) | Every step is spoken, with voice commands and buttons as a fallback |
| Human in the loop for v1 (answer to the doc's feasibility question) | The bystander answers triage questions; the AI does not diagnose |

It runs in a browser on a phone or laptop. The protocol is stored as data, so the same content can move to a headset (Unity/WebXR) later.

---

## 2. What it does, screen by screen

| # | Screen | What the bystander sees and hears | How it moves on |
|---|---|---|---|
| 0 | **Start** | "Dr.-VR ready." Prototype banner. | Say "help" or tap Start |
| 1 | **Triage** | Four yes/no questions, one at a time (see 2.1) | Say or tap "yes" / "no" |
| 2 | **Result** | "This looks like a possible opioid overdose. Use naloxone?" | Say or tap "yes" |
| 3 | **Call 911** | "Call 911 now and put your phone on speaker. If they stop breathing, the dispatcher will coach you through CPR." | "next" |
| 4 | **Get the kit** | Kit diagram with **Bay 1 (red)** flashing. "Open Bay 1. Take out the Narcan nasal spray." | "next" |
| 5 | **Position** | "Lay them on their back." | "next" |
| 6 | **Prepare** | "Peel open the package. Thumb on the plunger, two fingers on either side of the nozzle." | "next" |
| 7 | **Insert** | "Tilt their head back and support the neck with your hand. Put the nozzle in one nostril until your fingers touch the bottom of their nose." | "next" |
| 8 | **Spray** | "Press the plunger firmly." | Say "dose given" |
| 9 | **Recovery + timer** | "Roll them onto their side. Watch their breathing." Large countdown (2:30). | Timer runs out |
| 10 | **Check-in** | "Are they waking up or breathing normally?" | "yes" → 11a · "no", or no answer for 15 s → 11b |
| 11a | **Recovering** | "Keep them on their side. Stay with them until EMS arrives." | Ends at the handoff |
| 11b | **Second dose** | Red alert: "Give a second dose: new spray, other nostril." | Back to step 7, then the timer restarts |
| 12 | **EMS handoff** | A timestamped log of everything that happened | Done |

**Out of doses:** the kit holds one Narcan dual pack, which is 2 doses (see the planning doc's bay table). If the second check-in also fails, the app says: "No doses left. Keep them on their side and follow the 911 dispatcher."

### 2.1 Triage rules (v1, rule-based, no AI)

| Question | Answer → what happens |
|---|---|
| Q1. "Do they respond when you shout and shake their shoulder?" | **Yes** → "Stay with them. Call 911 if they get worse." (end) |
| Q2. "Is their breathing very slow, gasping, or stopped?" | **No** → "Put them on their side, call 911, and watch their breathing." (end) |
| Q3. "Are their pupils very small, like pinpoints?" | Recorded; changes the wording on the Result screen |
| Q4. "Are their lips or fingertips blue or gray?" | Recorded; changes the wording on the Result screen |

- If Q1 is **no** and Q2 is **yes**, the naloxone flow starts.
- If Q3 or Q4 is also yes: "This looks like a possible opioid overdose."
- If neither is yes: "An overdose is possible. Naloxone is safe to give if opioids could be involved."

> These rules need a review against published guidance before the app is shown outside the team.

### 2.2 Voice commands

| Say | Does |
|---|---|
| "help" | Starts the protocol |
| "yes" / "no" | Answers the current question |
| "next" / "back" | Moves between steps |
| "repeat" | Reads the current step again |
| "dose given" | Logs the dose and starts the timer |

Every command also has a large on-screen button. The buttons are the fallback when it's too noisy for voice.

**Keyboard shortcuts** (a third fallback for the presenter): `Y` / `N` answer, `→` next, `←` back, `D` dose given, `R` repeat.

The line under the step card shows what the app heard and what it did with it, for example *Heard "next" → next*. That lets the audience see the voice control working. If the microphone picks up the app's own voice, the line says it ignored it.

### 2.3 EMS handoff log (example)

```
14:01:32  Protocol started
14:01:58  Triage: unresponsive, abnormal breathing, pinpoint pupils
14:02:10  Dose 1 given
14:04:40  Check-in: no response
14:04:55  Dose 2 given
14:07:25  Check-in: breathing normally
```

There is no patient name or history in the log, so it needs no HIPAA handling. It records only what happened at the scene.

---

## 3. Real now vs. not yet

Say this out loud in the demo, so nobody leaves thinking the AI exists.

| Real in this demo | Not in this demo (separate, longer R&D) |
|---|---|
| Step-by-step guidance driven by a protocol file | Camera diagnosis (pupils, breathing rate, skin color) |
| Spoken steps and voice commands | CPR compression-depth feedback from a depth camera |
| Rule-based triage questions | Reading heart rhythm from the AED's electronics |
| Dose timer and second-dose alert | Smart kit bays (RFID / LED) |
| EMS handoff log | Headset hardware and on-device processing |
| Printed kit layout as the fallback | Live link to a hospital or medical center |
|   | Drone delivery and the hydrogen capsule |

---

## 4. Kit layout (manual fallback)

The planning doc says there is no color or number system for the bays yet. This demo uses the following layout, based on the doc's bay table. **It's a proposal; confirm it or replace it.**

| Bay | Contents | Color |
|---|---|---|
| 1 | Life Threat: Narcan, AED, tourniquets, chest seals | Red |
| 2 | Diagnostics: pulse oximeter, blood pressure cuff, thermometer | Blue |
| 3 | Trauma / Burn: splints, dressings, wraps | Orange |
| 4 | First Aid / Pharma: bandages, medications, EpiPen | Green |
| 5 | PPE / Tools / Tech: gloves, shears, power bank | Gray |
| 6 | VR headset | Purple |

---

## 5. How it's built

- **Stack:** Vite + React + TypeScript. No backend.
- **Voice:** the browser's Web Speech API. `speechSynthesis` reads steps aloud. `SpeechRecognition` listens for commands.
- **Protocol as data:** all wording, steps and timings live in `src/protocols/naloxone.json`. The engine reads that file. Adding a protocol means adding a file.
- **Demo speed:** opening the app with `?demo=1` shortens the 2:30 timer to about 15 seconds, so the demo doesn't stall. Without the flag, it uses the real timing.
- **Data:** nothing is saved or sent, with one exception: Chrome's speech recognition sends microphone audio to Google's servers to turn it into text. That's why voice commands need internet (see Q&A).

### One-day build plan

| Hours | Work |
|---|---|
| 0–1 | Project setup; write `naloxone.json` |
| 1–3 | Protocol engine (step state machine) and the dark "headset view" interface |
| 3–4 | Kit diagram (SVG) with the flashing Bay 1 |
| 4–5 | Dose timer, check-in, second-dose and out-of-doses logic |
| 5–6 | Voice: speak each step; listen for commands |
| 6–7 | EMS handoff log screen |
| 7–8 | Rehearse the demo; record a backup video |

### Running it

You need Node 22.12 or newer. In this folder:

```
npm install        # first time only
npm run dev        # starts the app
```

Then open **http://localhost:5173/?demo=1** in Chrome. Without `?demo=1` the app uses the real 2:30 timing.

| Command | What it does |
|---|---|
| `npm test` | Runs the 42 automated checks on the engine and the voice commands |
| `npm run build` | Type-checks, then builds a static copy into `dist/` |

**Demo-only button:** with `?demo=1`, the recovery countdown shows a "Skip wait (demo)" button. Use it if the meeting is short.

### Where things are

| File | What's in it |
|---|---|
| `src/protocols/naloxone.json` | Every word, branch and timing of the protocol. Edit wording here, not in the code. |
| `flowchart.md` | A flowchart of every question and branch in the protocol. Update it when a branch changes. |
| `src/engine/engine.ts` | The protocol engine: a pure state machine with no screen or speech code |
| `src/engine/validate.ts` | Checks a protocol file when the app loads (for example, a branch pointing at a missing step) |
| `src/speech/` | Voice: what counts as a command, the echo filter, and the browser speech wrapper |
| `src/components/` | Kit diagram, illustrations, countdown, handoff log |
| `src/kit.ts` | Bay numbers, names and colors (§4) |

### What has been checked

- **Automated tests (42):**
  - every triage branch
  - the 2:30 and demo timers
  - silence counted as "no"
  - the switch to the other nostril
  - running out of doses
  - "back" being blocked during timers and after a dose
  - the exact handoff log wording
  - that no spoken line can trigger a voice command
- **In a browser:**
  - the whole demo path, run with clicks, keyboard and simulated voice input
  - phone width (390 px) with no sideways scrolling
- **Not checked yet:** a real microphone and speakers in a real room. Do one full run before the meeting (§6).

---

## 6. How to demo it (about 5 minutes)

### Before the meeting

- [ ] Use Chrome on the demo device. Turn the volume up. Allow and test the microphone.
- [ ] Do one full run by voice in the room you'll present in. Room noise and speaker volume change how well voice works.
- [ ] Use a reliable network, because voice commands need internet.
- [ ] Open the app with `?demo=1`.
- [ ] Have a prop: the printed kit diagram, or a box labelled "Bay 1".
- [ ] Record one clean run as a backup video.
- [ ] Check the step wording against the current Narcan label.

### Script

1. **Framing (30 sec).** "This is the guidance part of Dr.-VR, the part that tells a bystander what to do once the kit arrives. It runs on a phone today. The protocol is a data file, so it can move to a headset later."
2. **Hand them the device (2 min).** Your manager plays the bystander and follows the app without help from you. That shows the product's main claim, that it turns a bystander into a responder. At the check-in, ask them to stay silent; the second-dose alert fires by itself. Mention that the real wait is 2–3 minutes.
3. **Handoff log (30 sec).** "This is what the arriving EMS crew sees. There's no patient data, so there's no HIPAA issue."
4. **Real vs. not yet (1 min).** Go through the table in section 3.
5. **Next step (30 sec).** "CPR and AED is the next protocol, mostly content work on the same engine. Then the QR bay highlight. Can we agree that's the next milestone?"

### Questions to be ready for

| Question | Answer |
|---|---|
| "Where's the AI?" | "Triage is rule-based on purpose. The planning doc says v1 keeps a human in the loop. Camera diagnosis is a separate R&D track." |
| "Does it work in a dead zone?" | "The spoken steps and buttons do. Voice commands need internet in Chrome today, so a headset version would need speech recognition running on the device." |
| "What data leaves the device?" | "Only the microphone audio Chrome sends for speech recognition. The headset version would keep that on the device too." |
| "How fast can we add EpiPen?" | "The engine doesn't change. It's a new protocol file plus a medical review." |
| "Why not show the drone?" | "The kit and guidance are worth something even without a drone, and they're what we can test now." |

---

## 7. Open questions (not blocking the build)

- [ ] **Work authorization:** confirm it's active before starting, as your planning log says.
- [ ] **Milestone:** does your manager agree that "one feature, proven on naloxone" is the next milestone?
- [ ] **Bay colors and numbers:** confirm or replace the proposal in section 4.
- [ ] **Medical review:** who reviews the triage rules and step wording before the app is shown outside the team?

---

## Sources

- NARCAN® Nasal Spray, *Quick Start Guide* / package insert: recognizing an overdose, giving the dose, recovery position, re-dosing every 2–3 minutes in the other nostril.
- SAMHSA, *Opioid Overdose Prevention Toolkit*: signs of overdose and the steps for lay responders.
- Product planning doc (`../product planning - drone - Josh comments (1).docx`): kit bay contents, the opioid reversal feature spec, and the design answers (voice-first, human-in-the-loop, manual kit layout as the fallback).
