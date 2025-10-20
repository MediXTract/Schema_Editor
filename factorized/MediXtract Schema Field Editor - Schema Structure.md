The MediXtract JSON Schema Summary outlines a standardized structure for defining clinical variables and tracking the per-patient performance of an automated extraction system (MediXtract) against human-validated data.



## Variable Definition Fields



Each clinical variable is defined by a set of required and optional fields:



| Field | Requirement | Purpose | Key Content / Format |

| :--- | :--- | :--- | :--- |

| **`anyOf`** | Required (Yes) | Defines all valid data types and formats, including allowing `null` (missing data). | Array of schema objects, e.g., `[{"type": "number"}, {"type": "null"}]`. |

| **`default`** | Required (Yes) | The value to use when data is absent. | Must match a type in `anyOf`; typically `null`, `0`, or `""`. |

| **`description`** | Required (Yes) | A human-readable definition, extraction rules, and context/units. | String, e.g., "Gestational age at birth in completed weeks..." |

| **`group_id`** | Required (Yes) | A logical category for grouping variables. | String, e.g., `"group_1"`, `"group_3"`. |

| **`options`** | Conditional ($\text{\usefont{T1}{lmss}{m}{n}\text{\normalfont\large\kern.05em\text{\char"2699\kern.05em}}}$) | Maps enumerated codes in the `enum` (if used in `anyOf`) to human-readable labels. | Object, e.g., `{"0": "No", "1": "Yes"}`. |

| **`notes`** | Optional | Free-text observations on extraction patterns or challenges. | String, e.g., "Extraction easiest when discharge summary is present." |

| **`was_solved`** | Optional | Marks conditions resolved before per-patient review. Must include $\ge 1$ subcategory flag, a `comment`, and `changed_at` (ISO 8601). | Object, e.g., `{"was_questioned": true, "comment": "...", "changed_at": "..."}`. |

| **`performance`** | Optional | Per-patient performance data, detailing MediXtract's success against human validation. | Object containing patient-specific status entries. |



---



## Performance (Per-Patient)



Performance entries track how MediXtract fared for a **patient-variable pair**, utilizing a **mutually exclusive** set of statuses.



### Core Statuses



| Field | Type | Meaning / Usage | Exclusivity Rule |

| :--- | :--- | :--- | :--- |

| **`matched`** | Boolean (Optional) | MediXtract's extraction agrees with human-validated data. | Cannot coexist with `pending`, `unmatched` or `blank`. |

| **`unmatched`** | Object (Optional) | MediXtract differs from human extraction. Must contain one or more *reason flags*. | Cannot coexist with `pending`, `matched` or `blank`. |

| **`blank`** | Boolean (Optional) | Both MediXtract and human reviewer got a null for that vatiable. | Cannot coexist with `matched`, `unmatched` or `pending`. |

| **`pending`** | Boolean (Optional) | Review is still pending for the patient-variable pair. | Cannot coexist with `matched`, `unmatched` or `blank`. |


### Reasons for `unmatched`



The `unmatched` object must contain flags indicating the cause of the discrepancy.



#### 🔹 Improvements (MediXtract Outperformed Human)

* **`filled_blank`**: MediXtract found a value the human missed.

* **`correction`**: MediXtract corrected a human error.

* **`standardized`**: MediXtract applied consistent formatting or calculation.

* **`improved_comment`**: MediXtract produced a better descriptive comment.



#### 🔹 Issues (Documentation or Ambiguity)

* **`missing_docs`**: Known or suspected missing documentation caused the discrepancy.

* **`contradictions`**: Conflicting information exists in the source records.

* **`questioned`**: Ambiguous definition or scope requires expert clarification.



### Shared Context Fields



These fields provide essential context for all performance entries:



* **`severity`**: A numerical impact rating (1–10).

* **`comment`**: A recommended, human-readable explanation or rationale.

* **`last_updated`**: A required **ISO 8601 UTC timestamp** of the latest modification.



---



## Was Solved (Variable-Level)



The `was_solved` object indicates that a variable-level condition was resolved prior to per-patient evaluation. Its presence implies **`was_solved = true`** for the variable.



| Subcategory Flag | Meaning / Usage |

| :--- | :--- |

| **`was_missing_docs`** | Previously missing documentation was addressed. |

| **`was_questioned`** | Prior definition/criteria ambiguity was clarified. |

| **`was_personal_data`** | Recognized as personal data and handled appropriately. |



**Required Fields when Present:**

1.  At least one subcategory flag must be set to `true`.

2.  **`comment`** (string) - Describes what was solved and how.


3.  **`changed_at`** (string, ISO 8601) - UTC timestamp of when the variable entered this solved state.
