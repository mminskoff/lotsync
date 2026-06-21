# LotSync — Future Roadmap

> **Important for AI agents reading this file:** These are future ideas and planned expansions, not current build scope. Do not implement anything in this document unless it appears in `current_scope.md`. These ideas are captured here for product planning purposes only.

---

## Phase 2 — LotIQ (6–12 Months Post-Launch)

AI begins helping dealers interpret their own data.

**Prerequisite:** LotSync is live at enough dealerships to have meaningful single-dealer data per rooftop. AI features in this phase work on individual dealer data — no cross-dealer intelligence required yet.

### AI Lot Health Score (LotIQ Score)
Every vehicle on the lot receives a composite score based on:

| Factor | Description |
|---|---|
| Price competitiveness | How this vehicle's price compares to similar market listings |
| Lead activity | VDP views, lead volume relative to similar vehicles |
| Days supply | How many days of supply remain at current sell rate |
| Market demand | Regional search volume and trend for this make/model/trim |
| Gross profit potential | Expected gross vs. floor plan cost at current price |

**Output:** LotIQ Score: 81/100 with factor breakdown per vehicle.

Manager sees at a glance which cars need action, which to reprice, which to consider wholesaling.

### "Move This Car" AI
Dealer asks: *Why hasn't this Explorer sold?*

System responds with diagnosis:
- 12% overpriced vs. market
- Poor photo quality detected
- Low regional search volume for this trim
- 3 competing units nearby priced lower
- Days on lot: 62

System suggests specific actions:
- Reduce price $1,000
- Move to front row
- Promote on Facebook Marketplace
- Wholesale trigger if unsold in 14 days

This transitions LotSync from displaying data to recommending decisions.

### Aging Alerts
- Proactive alerts when a vehicle crosses age thresholds (30/45/60/90 days)
- Projected loss estimate based on floor plan rate
- Recommended price adjustment to stimulate movement
- Alert: "This Tacoma has been on lot 58 days. At current pace, floor plan cost exceeds projected gross in 9 days."

### Pricing Recommendations
- Per-vehicle price suggestions based on market position
- "You're $1,200 above the 3 comparable listings in your market. This vehicle has 40% fewer leads than average."
- Manager approves/declines — does not auto-change prices in Phase 2

---

## Phase 3 — Inventory Intelligence (12–24 Months Post-Launch)

AI begins making decisions, not just recommendations. Requires data at scale across multiple dealers.

### Dynamic Demand-Based Pricing Engine
Pull signals from:
- Local market listings (competitive pricing)
- Auction data (wholesale floor values)
- Search demand (regional VDP and search volume trends)
- Lead volume per vehicle
- Inventory age + floor plan cost
- Competitor pricing velocity

Output:
- "Increase this F-150 by $900. Demand is rising and you're currently under market."
- "This Bronco is priced $1,800 above market and generating 40% fewer leads."

Think: Uber surge pricing logic applied to car inventory.

This is a potential standalone product.

### Consumer Demand Radar™
Before dealers know demand is shifting, LotSync detects it from cross-dealer data signals:

- "Toyota hybrid demand up 18% in your region over the past 30 days."
- "Used EV demand down 11% — consider reducing acquisition."
- "Wrangler search volume rising regionally. Inventory is thin."

Dealers who act on this buy the right inventory before competitors catch up.

This is where the data moat compounds. Each dealer that joins makes the signal stronger for all dealers.

### AI Inventory Acquisition Recommendations
System identifies inventory gaps and recommends acquisitions:

- "You've sold 14 F-150s in 45 days and have 3 left. Historical pace suggests you need 8–10 more."
- Recommends sources: auctions, trade-in desk, marketplace, dealer trades
- Prioritizes by margin opportunity and regional demand

Most DMS software manages existing inventory. Few tell dealers what to buy next.

### Real-Time Gross Profit Forecasting
Bloomberg Terminal-style view:
- Current inventory value: $12.4M
- Projected gross at current sell-through: $2.1M
- Risk inventory (aging, over-market): $740K
- Expected aging loss if no action taken: $120K
- Floor plan cost accruing daily: $4,200

---

## Phase 4 — The Big Vision (24+ Months)

**"Bloomberg Terminal for Dealerships"**

LotSync knows: what to buy, what to sell, what to wholesale, what to price, what will sell next.

Every morning, the dealer principal opens the dashboard and sees:

**Today's Actions**
- Lower Bronco $750 — 12% over market, leads down 40%
- Move Wrangler to front row — high foot traffic zone, high regional demand
- Acquire 3 Highlanders — sold 11 in 60 days, only 2 left
- Wholesale Explorer — Day 91, gross now negative after floor plan
- Raise F-150 pricing $900 — demand spike, you're under market

The dealer acts on AI recommendations rather than gut feel.

---

## Additional Future Features (Unsequenced)

### Smart Lot Placement
Using foot traffic data, sales history, and vehicle demand, LotSync recommends physical placement of vehicles on the lot:
- "Move VIN 1234 to front row — high-demand vehicle with above-average traffic in that zone"
- "Position Wrangler near showroom entrance"
- Retail shelf optimization logic applied to vehicle lots

### Dealer-to-Dealer Inventory Exchange
- Dealer A needs: White Bronco
- Dealer B has: White Bronco, day 85, needs to move
- LotSync automatically surfaces the match
- Potential for a marketplace model at scale

### Interactive Consumer ESL / Window Sticker
Same ESL hardware, consumer-facing QR code experience:
- Payment calculator
- Trade-in estimate
- Carfax report
- Video walkaround
- Similar vehicles nearby
- The window sticker becomes interactive

### AI Lot Camera Analytics
Install cameras at lot entry/exit and key positions:
- Detect empty spaces
- Track vehicle movements
- Identify missing ESL tags
- Measure customer engagement zones (hot/cold areas)
- Alert on anomalies
LotSync becomes a physical operations platform, not just a software layer.

---

## Feature Prioritization Matrix

| Feature | AI Moat | Revenue Impact | Build Difficulty | "Holy Sh*t" Factor |
|---|---|---|---|---|
| Dynamic Demand Pricing | 10/10 | 10/10 | 8/10 | 9/10 |
| AI Inventory Acquisition | 10/10 | 10/10 | 9/10 | 10/10 |
| AI Lot Health Score | 8/10 | 8/10 | 5/10 | 7/10 |
| Move This Car AI | 9/10 | 9/10 | 6/10 | 8/10 |
| Consumer Demand Radar | 10/10 | 10/10 | 10/10 | 10/10 |
| Smart Lot Placement | 7/10 | 6/10 | 7/10 | 9/10 |
| Camera Analytics | 8/10 | 7/10 | 9/10 | 9/10 |
| Dealer Inventory Exchange | 7/10 | 10/10 | 8/10 | 8/10 |
| Dynamic ESL Content | 6/10 | 6/10 | 4/10 | 7/10 |
| Gross Forecast Engine | 8/10 | 8/10 | 7/10 | 8/10 |

**Note on sequencing:** Consumer Demand Radar and AI Acquisition both score highest but require data at scale. Lot Health Score and Move This Car AI are the right Phase 2 bets — they work on single-dealer data and build the habit of trusting LotSync recommendations before dealers need to act on cross-market signals.
