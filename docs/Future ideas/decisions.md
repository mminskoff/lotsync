# LotSync — Product Decisions Log

This file captures significant product decisions and the reasoning behind them. The goal is to preserve context that won't be obvious from code or specs six months from now.

---

## Decision: ESL + Real-Time Pricing Display as Starter Product

**Date:** June 2026  
**Decision:** Lead with ESL hardware + live pricing sync as the core product, not AI features.

**Why:**
Real-time pricing display solves an immediate, measurable operational problem: dealers lose money every day a vehicle sits on the lot with a stale price. Floor plan interest accrues. Manufacturer incentive penalties compound. Depreciation accelerates. The ESL + DMS sync eliminates that lag and delivers quantifiable ROI before any AI is involved.

AI features require data. Data requires dealers. Dealers require a working product. Starting with ESL management is the right sequence — it's not a hook to get in the door, it's a product that stands on its own.

**What we decided not to do:** Launch with pricing intelligence or AI recommendations as the primary value prop. Those require scale we don't have yet, and leading with AI before the operational foundation is solid would be premature.

---

## Decision: Separate "Current Scope" from "Future Roadmap" in Docs

**Date:** June 2026  
**Decision:** Maintain strict separation between `current_scope.md` (build now) and `future_roadmap.md` (future ideas).

**Why:**
AI coding agents (Cursor, Claude, etc.) read project context to understand what to build. When future ideas and current scope live in the same document, agents begin implementing future features before the foundation is stable. The separation also enforces discipline for the team — scope creep almost always starts as a documentation problem.

**Rule:** If it's not in `current_scope.md`, it doesn't get built in the current phase, regardless of how good the idea is.

---

## Decision: Mobile-First Pairing Flow, Target Under 10 Seconds

**Date:** June 2026  
**Decision:** The lot attendant pairing experience must complete in under 10 seconds and work one-handed in bright sunlight.

**Why:**
Lot attendants are walking, often in direct sun, frequently distracted. If the pairing flow requires more than a few taps after scanning, adoption will fail. The app is a tool, not a product they're excited to explore. Speed and reliability matter more than features.

**Implication:** The mobile app has a deliberately narrow feature set. No feature gets added to the mobile app unless it's something a lot attendant actually needs while standing next to a car.

---

## Decision: Offline-First Mobile Architecture

**Date:** June 2026  
**Decision:** The mobile app queues pairings locally when offline and syncs on reconnection.

**Why:**
Dealership lots often have poor WiFi coverage. If the app fails when connectivity drops, attendants will work around it (paper lists, no tagging) and adoption collapses. The app must work regardless of connectivity.

**Implication:** Pairing data is stored locally first, synced to server when connected. Conflict resolution needed for edge cases (same ESL paired to two vehicles while offline).

---

*Add new decisions as they are made. Include: what was decided, why, and what alternatives were considered and rejected.*
