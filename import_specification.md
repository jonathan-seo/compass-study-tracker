# 📄 Study Import Specification (JSON Schema)

This document defines the JSON structure required to import studies into the Compass Study Tracker. You can copy this specification and paste it directly into your second brain to instruct it on generating matching calendar files.

## General Requirements
*   **Format:** The file must contain a single JSON array of study objects.
*   **Encoding:** UTF-8
*   **Filename Extension:** `.json`

---

## Study Schema Definitions

Each object in the array represents a single study and must conform to the following fields:

| Field Name | Type | Required | Default | Allowed Values / Format | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`title`** | String | **Yes** | — | Non-empty string | The title of the Bible study or event. |
| **`ministryId`** | String | **Yes** | — | `mens`, `womens_mon`, `womens_thu`, `womens_shel`, `womens_gv`, `seniors`, `focus_groups` | The ID corresponding to the church ministry. |
| **`startDate`** | String | **Yes** | — | `YYYY-MM-DD` (e.g., `2026-09-13`) | The start date of the study. |
| **`weeks`** | Number | No | `6` | Positive integer (e.g. `8`) | Duration of the study in weeks. |
| **`location`** | String | No | `"Orangeville"` | `Orangeville`, `Shelburne`, `Grand Valley`, `Other` | Physical location where group meets. |
| **`stage`** | String | No | `"planning"` | `planning`, `approval`, `sourcing`, `promotion`, `active`, `review` | The active stage index in the workflow. |
| **`studyMaterial`** | String | No | `"Not Started"` | Refer to options | Status of curriculum sourcing. |
| **`physicalResources`** | String | No | `"Not required"` | Refer to options | Status of workbooks/books procurement. |
| **`digitalResources`** | String | No | `"Not required"` | Refer to options | Status of digital files/rightnow media. |
| **`imageUrl`** | String | No | `""` | Valid HTTP/S image URL string | Cover thumbnail image reference. |
| **`resourcesObtained`**| Boolean | No | `false` | `true` or `false` | Checkbox flag: resources procured. |
| **`websiteUpdated`** | Boolean | No | `false` | `true` or `false` | Checkbox flag: promotion/website live. |
| **`liveTracking`** | String | No | `"Not started"` | `Not started`, `In Progress`, `Completed` | Weekly progress tracking. |
| **`postReview`** | String | No | `"Not Started"` | `Not Started`, `In Progress`, `Completed` | Post-study review evaluation. |
| **`notes`** | String | No | `""` | Multiline string | Internal notes or general information. |
| **`promoText`** | String | No | `""` | Multiline string | Promotional copy for signups or bulletin. |
| **`updates`** | String | No | `""` | Multiline string | Dynamic status updates or log. |

---

## Allowed Option Lists

### `studyMaterial`
`"Not Started"`, `"Requested from Team"`, `"Received from Team"`, `"Reviewed by Director"`, `"Approved / Team Notified"`

### `physicalResources`
`"Required"`, `"Quote request sent"`, `"Order placed"`, `"Received and distributed"`, `"Not required"`

### `digitalResources`
`"Required"`, `"Procured and available"`, `"Not required"`

---

## Example JSON Payload

```json
[
  {
    "title": "The Acts of the Apostles",
    "ministryId": "mens",
    "startDate": "2026-09-13",
    "weeks": 8,
    "location": "Orangeville",
    "stage": "planning",
    "notes": "A dynamic 8-week look at the early church's history.",
    "imageUrl": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120"
  },
  {
    "title": "What Love Is",
    "ministryId": "womens_gv",
    "startDate": "2026-03-02",
    "weeks": 10,
    "location": "Grand Valley",
    "stage": "approval",
    "notes": "Women's ministry study on 1, 2, 3 John.",
    "studyMaterial": "Approved / Team Notified",
    "physicalResources": "Order placed",
    "resourcesObtained": false,
    "websiteUpdated": true
  }
]
```

---

## Merge & Conflict Resolution Rules

When this JSON is uploaded, the app calculates matching records and classifies them into:
1.  **New:** If no existing record in the database matches the combination of `(title + ministryId + startDate)`.
2.  **Conflict:** If a record matches `(title + ministryId + startDate)` but has different values for secondary attributes (e.g. `weeks`, `notes`, `location`).
3.  **Unchanged:** If a record matches `(title + ministryId + startDate)` and all other properties are identical.

The user will see a detailed side-by-side comparison of all differences and can select which studies to merge into the live database.
