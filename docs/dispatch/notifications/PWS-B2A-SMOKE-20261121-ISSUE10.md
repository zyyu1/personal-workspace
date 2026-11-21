# B2A One-Time Notification Authorization — PWS-B2A-SMOKE-20261121-ISSUE10

**Design Window Authorization:** ONE-TIME LIVE B2A NOTIFICATION PROBE ONLY — 2026-11-21
**Purpose:** Test the delivery of a fixed-format, harmless notice to the original Codex Desktop thread and verify the exact matching ACK. No development instructions are authorized.
**Issue:** https://github.com/zyyu1/personal-workspace/issues/10
**Expires:** 2026-11-23T18:00:00+01:00
**Scope:** One operator-controlled `--notify-once --enable-notifications` attempt, with local exact-thread binding and durable outbox. No unattended polling, no resends on ambiguous delivery.

```notification-authorization
{
  "schema_version": 2,
  "dispatch_id": "PWS-B2A-SMOKE-20261121-ISSUE10",
  "mode": "probe",
  "module": "dispatch-b2a",
  "repo": "zyyu1/personal-workspace",
  "issue_number": 10,
  "notification_authorized": true,
  "authorization_scope": "NOTIFICATION_ONLY",
  "handoff_path": "docs/dispatch/B2_DESIGN_APPROVED.md",
  "handoff_blob_sha": "7573e5c9cdc2b3a9fd14a46568f8f4ad49019a67",
  "notification_template_version": 1,
  "expires_at": "2026-11-23T18:00:00+01:00",
  "nonce": "PWSB2A-NONCE-20261121-ISSUE10",
  "created_by": "zyyu1"
}
```

After one attempt, the Design Window must close or cancel Issue #10 and remove its approval label. Queue submission alone is never delivery/ACK proof; the original Desktop thread's exact nonce reply is required. This record is a notification authorization only, **never a permission to edit code, merge, or implement Modules 007/008**. Do not edit this record in place after pinning its Git blob SHA in the Issue; edits invalidate authorization.
