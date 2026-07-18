# Second Brain integration

The Study Tracker remains the canonical store for study lifecycle, curriculum, resource, launch readiness, promotion, live-tracking, and post-study-review status. Second Brain supplies durable ministry context, and TodoJ remains Jonathan's source of truth for active personal tasks.

## Endpoint

Vercel serves the Node function at:

```text
/api/second-brain/studies
```

Every request requires:

```http
Authorization: Bearer <SECOND_BRAIN_SYNC_TOKEN>
```

The function reads and writes the Firestore `ministry_studies` collection with Firebase Admin credentials. It does not automate the visible tracker UI.

## Required Vercel environment variables

```text
SECOND_BRAIN_SYNC_TOKEN
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Use a Firebase service account scoped to the `compass-study-tracker` project. Store the private key only as an encrypted Vercel environment variable or local secret; never commit it.

## Read studies

```http
GET /api/second-brain/studies?ministryYear=2026-2027&needsAction=true
```

The response adds:

- `ministryYear`, using September through August;
- `needsAction`;
- `actionSignals` for incomplete approval, resources, launch blockers, overdue launch checkpoints, promotion, live tracking, or post-study review;
- `launchSummary`, including readiness percentage, blocked/overdue/due-soon counts, and the next checkpoint.

The bridge reports observable tracker state and does not invent ordering or promotion deadlines.

## Preview and create a study

POST requests are dry-run by default:

```json
{
  "study": {
    "title": "Example Study",
    "ministryId": "mens",
    "startDate": "2026-09-17"
  }
}
```

Set `"apply": true` only after reviewing the preview. The endpoint rejects an exact `(title + ministryId + startDate)` duplicate.

## Preview and update a study

PATCH requests are also dry-run by default:

```json
{
  "id": "firestore-document-id",
  "expectedUpdatedAt": "2026-07-15T18:00:00.000Z",
  "changes": {
    "physicalResources": "Received and distributed",
    "resourcesObtained": true
  }
}
```

Set `"apply": true` to write. When `expectedUpdatedAt` is present, the update runs in a Firestore transaction and returns `409 Conflict` if the record changed after it was read.

Only the documented Study Tracker fields are writable. Delete is intentionally not exposed.

## Launch readiness payload

The optional embedded `launchPlan` keeps existing studies backward compatible. A plan contains:

- selected workflow profiles;
- Planning Center page mode and production path;
- public launch, kickoff, and study-end anchors;
- generated checkpoints with owner, status, calculated date, override, next action, blocker, working notes, evidence, and completion date.

The current ministry-study default is `information_only`; it does not create signup or payment requirements. The default production path is `admin_handoff`. Choosing `jonathan_self_service` adds the conditional independent-proof checkpoint.

The app creates and recalculates plans. The API validates a complete nested `launchPlan` when Second Brain later previews or applies one.

## Local Second Brain command

The vault-side command is:

```text
System/Productivity Reports/scripts/compass_study_tracker_bridge.py
```

It reads these local environment variables:

```text
COMPASS_STUDY_TRACKER_API_URL
COMPASS_STUDY_TRACKER_SYNC_TOKEN
```

List operations are read-only. Create and update commands preview by default and require `--apply` for a live write.

## Deployment sequence

1. Review and merge this branch.
2. Configure the four Vercel environment variables.
3. Deploy the tracker.
4. Run an authenticated read for one ministry year.
5. Preview one harmless update.
6. Apply a controlled update and confirm it in the visible tracker.
7. Enable the tracker read step in ministry productivity reports.

Do not add automatic TodoJ creation until the action-signal wording and timing rules have been reviewed in live ministry use.
