# Module 009 — F-01 Design Window Ruling: Preserve Confirmed Calendar Evidence Against Unverified Corrections

**Date:** 2026-11-22 (Europe/Berlin)  
**Decision:** **F-01 OPTION A APPROVED, WITH EXPLICIT REVIEW WARNING / DESIGN RULING ONLY / NOT A CODE-EDIT AUTHORIZATION / PR #20 MERGE HOLD.**  
**Scope:** Module 009 Study Exams & Past Papers V1.0, exclusively exam-date evidence and Calendar projection continuity.  
**Work issue:** [#19](https://github.com/zyyu1/personal-workspace/issues/19); existing [Draft PR #20](https://github.com/zyyu1/personal-workspace/pull/20).  
**Independent QA result:** [report](https://github.com/zyyu1/personal-workspace/blob/720abcfa14c9d3cc69844240264415b62e6c8856/docs/handoffs/009/reports/MODULE_009_INDEPENDENT_QA_REVIEW_a042be2.tex), at exact candidate `a042be2304bee7ef56678d719ea3a09999a95cce`, **26 PASS / 4 PARTIAL / 0 FAIL, INSUFFICIENT EVIDENCE**. F-01 MEDIUM, row 25 PARTIAL.  
**Authoritative frozen design (unchanged):** [DESIGN_APPROVED.md](./DESIGN_APPROVED.md) §5.1, §8, acceptance rows 5–10, 25, 28–30; design blob `b986d69ba19838df70e1526b2a54ec7f6dcb1b1d`.  
**Source verified for ruling:** `src/services/globalCalendarService.ts`, `src/features/study/services/studyExamService.ts`, `src/features/study/components/ExamsView.tsx`, `src/components/GlobalCalendarPage.tsx`, `src/features/study/StudyExams.test.tsx` at PR HEAD `a042be2`.  
**Main snapshot for decision:** `8ba399b50d5a8f1f6b74d442f23ea153c09c3483`; recheck latest GitHub before any implementation.

## 1. Verified root cause and controlling product contract

The frozen design §5.1 requires (a) not projecting **unverified** milestones as confirmed Calendar deadlines, (b) preserving migrated 007 verified assessment fields and their **existing Calendar visibility**, and (c) no two exam projections for one canonical `CourseAssessment`. §8 additionally requires retaining `assessment-deadline` compatibility and one stable event identity.

In PR #20 `globalCalendarService.ts`, an active `kind='exam'` milestone is added to `examAssessmentIds` **before** `isCalendarEligible`. A new `verificationStatus='unverified'` milestone therefore suppresses the old verified legacy projection, but is itself ineligible for Calendar. Result: the exam vanishes from Calendar. In `ExamsView`, `examDateFor` picks the new active milestone first, so the existing legacy time remains in the Inspector yet the visible card shows only the tentative date. The save form displays no warning about confirmed-date continuity.

This behavior violates the frozen compatibility promise; it is not an acceptable interpretation of an unverified correction. The independent QA's F-01 MEDIUM finding is **UPHELD**.

## 2. Binding precedence rule

**Principle: A merely tentative/unverified exam-date candidate does not revoke or supersede previously confirmed exam-date evidence. Confirmation is the replacement threshold.** A positive confirmation is either `verificationStatus='user-confirmed'` or `source-verified`, at `datePrecision='date-only'|'exact'`, with its existing validation rules. `legacy-verified` is the preserved provenance of an originally verified 007 assessment, never silently promoted to `source-verified`. `unknown` and `unverified` alone can never become confirmed Calendar events.

For **a single active assessment and one actual exam**, select at most one Calendar exam event:
1. **Current confirmed dated exam milestone**, if one is valid, active and Calendar-eligible — use its date/precision/original IANA time; it replaces the prior confirmed projection, retaining historical evidence.
2. Otherwise, **previously confirmed date evidence that has not been explicitly invalidated**, initially including the verified 007 `CourseAssessment.officialDateTime`, is the Calendar fallback **while newer unverified proposals remain pending**. Label it as **previously verified / reconfirmation needed** if such a tentative proposal is present; never present it as indisputably current official time.
3. Otherwise, show **no confirmed exam Calendar event**. Display the tentative/unknown proposal only in Exams with its truthful status. No fake midnight, no duplicate event, no inferred verification.

**State-transition caution:** A later `unverified` proposal following an already confirmed 009 milestone must **not silently revive an obsolete 007 legacy date** and must not accidentally remove the *most recently confirmed still-valid* calendar projection. Treat a tentative proposal as **pending review**, not as an effective withdrawal of confirmed evidence. Current `setMilestone` supersedes the prior same-kind active milestone without checking verification, so this edge requires explicit design-consistent implementation and test coverage (either safe effective selection from immutable history or a narrow pending-versus-current lifecycle representation). **Do not** solve it by projecting arbitrarily superseded dates as newly verified, by assuming the earliest legacy date is current, or by silently rewriting verification metadata. If the existing v3 representation cannot preserve a defensible current-confirmed-versus-pending distinction without changing the schema contract, implementation must **STOP and present the smallest explicit data-model delta** for a separate decision.

Explicit **cancellation of the entire assessment** excludes its event even if previously verified. Cancellation/supersession of a tentative proposal must not *by itself* cancel a still-valid confirmed event. Conversely, when a user intentionally confirms a replacement, old dated projections must not reappear on subsequent cancellation without a distinct, explicit reinstatement decision.

## 3. Truthful user-facing behavior

**Calendar:** one item, using stable `id='calendar-assessment:<assessmentId>'`, `canonicalSourceId=<assessmentId>`, `sourceType='assessment-deadline'`. While a newer conflicting tentative proposal exists and a previously verified date remains as fallback, show an unmissable read-only indicator, e.g.:

> **Previously verified · Reconfirmation needed**  
> A newer tentative exam date exists. Check both dates in Exams.

Display the legacy event's **original stored date and time and original timezone**, never replace them with tentative numbers or upgrade the provenance. If a Calendar item uses the existing generic `verification` field, retain its truthful provenance and expose a **separate derived pending-review indicator**, or an equivalent explicit display; do not overwrite `verified=true` or silently relabel as `source-verified`. The user must not mistake the stale-possible date for a newly certified official schedule. Clicking the event should take the user to the correct `/study/courses/:offeringId/exams?assessment=<assessmentId>` Inspector (not an unrelated view).

**Exams card and Inspector:** show **both** values when a pending new proposal and previously confirmed evidence coexist. Clearly distinguish:
- Earlier confirmed evidence (legacy/source/user provenance, original date and timezone, may need reconfirmation).
- New tentative proposal (date-only/exact/unknown, unverified, not independently promoted into Calendar).
- Clear explanation of **which date is presently projected** and why; include accessible, textual status (not only a colored icon).
- A warning before saving a conflicting tentative exam milestone: saving it records a **proposal**, not official replacement, and the last confirmed date remains on Calendar marked for review. The form must not silently imply the old date was removed.
- The Study **Overview** summary, Exam card and Calendar must derive a compatible shared status; e.g. Overview must not say “not on Calendar” while the fallback event exists. Avoid creating a second mutable calendar/exam store.

**Explicit invalidation is a different user intent:** A user who knows the old date is no longer valid but does not have a replacement must not have their old verified evidence silently deleted. A deliberate **withdraw old date / mark previous confirmation invalid** operation would require an explicit user action, appropriate audit/history and a separate, bounded design + code authorization if the existing schema cannot represent it. For this F-01 compatibility ruling, **do not infer invalidation from a mere unverified or unknown date proposal**; do not secretly add a delete switch or edit the original 007 verification bit.

## 4. Core scenario matrix for future implementation and independent QA

| Case | Initial evidence | New step | Expected Calendar | Required UI/history |
| --- | --- | --- | --- | --- |
| F01-01 | Legacy `verified=true`, exact date | No milestone | Exactly one old event | Original date/time/zone/provenance preserved |
| F01-02 | Legacy verified, exact | Unverified `date-only`, different day | Exactly one **old** event | Review warning; show both dates; no tentative event |
| F01-03 | Legacy verified, exact | Unverified `exact`, different day/time | Exactly one **old** event | Review warning; preserve original timezone, no promotion |
| F01-04 | Legacy verified, exact | Unverified `unknown` | Exactly one **old** event | Explicit uncertainty; no invented time |
| F01-05 | Legacy verified, exact | `user-confirmed` date-only | Exactly one **new all-day** event | No time/midnight invented; legacy still historically readable |
| F01-06 | Legacy verified, exact | `source-verified` exact | Exactly one **new exact** event | Correct local + IANA/instant; verified source distinct |
| F01-07 | No previously verified date | Unverified exact/date-only/unknown | **No** confirmed exam event | Tentative in Exams only, no false date |
| F01-08 | Legacy verified + pending unverified | Cancel pending proposal | Exactly one **old** event | Review warning clears if no other pending proposal; old unchanged |
| F01-09 | Legacy verified or confirmed milestone | Cancel/archive assessment | **No** exam event | Preserve full evidence/history; no timed event |
| F01-10 | Earlier confirmed 009 milestone replaced old legacy | Later unverified proposal | Preserve last confirmed **still-valid** evidence, not arbitrarily the obsolete legacy | Clear pending-review state; no duplicate; history intact |
| F01-11 | Previously confirmed replacement | Newer confirmed replacement | Exactly one latest confirmed event | No resurrection of obsolete legacy or superseded record |
| F01-12 | Any above | Reopen after reload / two offerings / same-day duplicate | Stable event ID, at most one per assessment/owning offering | Same provenance and warning; no cross-offering leak |

**Release blockers for F-01:** Any F01-02/03/04 case silently removing the Calendar event; any unverified milestone projected as official; reanimation of obsolete 007 date following later confirmed 009 evidence; duplicate `assessment-deadline` events; false confirmed provenance; historical data overwritten; Overview/Exams/Calendar showing contradictory projection status.

Test direct service projection **and** genuine UI behavior where applicable. Re-run all existing Module 009 and prior 001–008 regression suites. Separate independent Review Only QA must verify rows 5, 7–9, 25, 28–30; F-01 fixes alone do not clear the separately open row 18/29/30 evidence or F-02 disclosure.

## 5. Alternatives considered and ruling

- **(A) Keep valid previously verified event until a new confirmed replacement, with visibly marked pending review — SELECTED.** Honors frozen design, avoids missing an important exam event and avoids lying about the tentative date. A mere new tentative note is not the same as a user's explicit revocation.
- **(B) Hide previously verified event on any tentative entry but warn — REJECTED.** Still loses the previously verified Calendar event and conflicts with the frozen §5.1 promise.
- **(C) Treat creation of an unverified milestone as a deliberate date invalidation — REJECTED.** Conflates uncertainty with a confirmed factual correction, and is not supported by the frozen model.

## 6. Governance, next gate

**THIS FILE IS A DESIGN INTERPRETATION/RULING, NOT AUTHORIZATION TO IMPLEMENT IT.** Do not amend the frozen `DESIGN_APPROVED.md`, re-score independent QA, edit `codex/module-009`, update tests or workflows, merge PR #20, or close Issue #19 on the strength of this publication. Do not create a separate implementation PR, start a new worker or run GitHub Actions in response to an Issue comment.

The Design Window must next issue **a separate, explicit F-01 code-only remediation instruction** against a freshly checked PR #20 head, with minimal file scope, preserved data/migration contract, exact-head CI and a new independent Review Only QA retest. If the source model needs a new pending/current state, it must be justified and approved explicitly before coding rather than silently added under a “one-line predicate fix.” The unresolved F-02 QA disclosure gap and Windows/permission-required verification remain distinct gates.

**Current status:** F-01 DESIGN RULING APPROVED / IMPLEMENTATION NOT AUTHORIZED BY THIS FILE / INDEPENDENT QA `26 PASS / 4 PARTIAL / 0 FAIL` AT `a042be2` / PR #20 DRAFT AND MERGE HOLD.
