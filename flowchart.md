# Naloxone protocol: question flowchart

Every question the app asks, and where each answer leads. Built from [`src/protocols/naloxone.json`](src/protocols/naloxone.json). If you change a branch there, update this file too.

```mermaid
flowchart TD
    START([Start]) --> Q1

    Q1{"Q1 · Do they respond?"}
    Q1 -- Yes --> E_RESPONSIVE
    Q1 -- No --> Q2

    Q2{"Q2 · Is their breathing very slow,<br/>gasping, or stopped?"}
    Q2 -- No --> E_BREATHING
    Q2 -- Yes --> Q3

    Q3{"Q3 · Are the pupils very small,<br/>like pinpoints?"}
    Q3 -- "Yes or No<br/>(recorded)" --> Q4

    Q4{"Q4 · Are their lips or fingertips<br/>blue or gray?"}
    Q4 -- "Yes or No<br/>(recorded)" --> RESULT

    RESULT{"Result · Use the naloxone<br/>in your kit?"}
    RESULT -- No --> E_NO_NALOXONE
    RESULT -- "Yes (highlighted)" --> CALL

    CALL["Call 911 now, on speaker"] --> KIT
    KIT["Open Bay 1, take out the Narcan"] --> LAY
    LAY["Lay them on their back"] --> PREP
    PREP["Get the spray ready"] --> INSERT
    INSERT["Insert the nozzle in a nostril"] --> SPRAY
    SPRAY["Press the plunger,<br/>then say “dose given”"] --> WAIT
    WAIT["Recovery position<br/>2:30 countdown"] --> CHECK

    CHECK{"Check-in · Are they waking up<br/>or breathing normally?"}
    CHECK -- Yes --> E_RECOVERING
    CHECK -- "No, or silent for 15 s<br/>(1 dose given)" --> SECOND
    CHECK -- "No, or silent for 15 s<br/>(2 doses given)" --> E_NO_DOSES

    SECOND["Give a second dose:<br/>new spray, other nostril"] --> PREP

    E_RESPONSIVE(["End · They're responding<br/>Stay with them; call 911 if worse"])
    E_BREATHING(["End · They're breathing<br/>On their side, call 911, keep watching"])
    E_NO_NALOXONE(["End · Call 911<br/>Follow the dispatcher"])
    E_RECOVERING(["End · They're responding<br/>Keep on side until EMS; naloxone can wear off"])
    E_NO_DOSES(["End · No doses left<br/>Follow the dispatcher until EMS"])

    classDef question fill:#e6f6fd,stroke:#1a8fbf,color:#06283a
    classDef good fill:#e3f8ec,stroke:#2a9d5c,color:#0b2e1a
    classDef alert fill:#fde8e8,stroke:#d93b3f,color:#3a0a0b
    classDef neutral fill:#eef1f3,stroke:#7b8a94,color:#1b252c
    class Q1,Q2,Q3,Q4,RESULT,CHECK question
    class E_RESPONSIVE,E_RECOVERING good
    class E_NO_DOSES,SECOND alert
    class E_BREATHING,E_NO_NALOXONE neutral
```

Diamonds are questions, rectangles are instructions (the user says "next"), and rounded boxes are endings. Every ending shows the EMS handoff log.

## The questions

| # | Step id | Question on screen | Yes → | No → |
|---|---|---|---|---|
| Q1 | `q-responds` | Shout their name, shake their shoulders, and firmly rub the middle of their chest. **Do they respond?** | End: *They're responding* | Q2 |
| Q2 | `q-breathing` | Watch their chest for up to 10 seconds. **Is their breathing very slow, gasping, or stopped?** | Q3 | End: *They're breathing* |
| Q3 | `q-pupils` | **Are the pupils very small, like pinpoints?** | Q4 | Q4 |
| Q4 | `q-lips` | **Are their lips or fingertips blue or gray?** | Result | Result |
| Result | `result` | **Use the naloxone in your kit?** (wording below) | Naloxone steps | End: *Call 911* |
| Check-in | `checkin` | **Are they waking up or breathing normally?** | End: *They're responding* | Second dose. After 2 doses: End: *No doses left* |

## Rules that aren't obvious from the diagram

- **Q3 and Q4 don't branch.** The app logs both answers, and they change what the Result screen says:
  - If either is Yes, it says *"This looks like a possible opioid overdose. Use the naloxone in your kit?"*
  - If both are No, it says *"An overdose is possible. Naloxone won't harm someone who hasn't taken opioids. Use the naloxone in your kit?"*
- **Silence counts as No at the check-in.** After 15 seconds with no answer (10 s with `?demo=1`), the app logs "no answer, counted as not responding" and moves on as if the answer was No.
- **The second dose goes back through the same steps with new wording:**
  - "Get the spray ready" becomes "Get a new spray ready".
  - "Insert the nozzle" becomes "Use the other nostril".
- **The kit holds 2 doses** (`maxDoses`). After the second dose, a No at the check-in ends at *No doses left* instead of starting a third dose.
- **Timer lengths:** the recovery countdown is 2:30, or 15 s with `?demo=1`.
- **Back:** the user can go back from questions and instructions. Going back is blocked during the countdown and the check-in, and once a dose is given (a dose can't be undone).
- **Button colors:** Yes and No look the same on every question except Result. There, Yes is highlighted because the guidance favors giving naloxone. This is set by `"recommended": "yes"` in the protocol file.
