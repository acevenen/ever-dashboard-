# Ever Dashboard

**Built by Ace Venenciano — Inventory Specialist, Ever Cars SF**

---

## Why I Built This

I work the floor at Ever Cars as an inventory specialist. My day involves prepping vehicles for delivery, receiving inbound cars, and sometimes shuttling vehicles between vendors. I am not an engineer by title — but I am someone who watches how things break and thinks about how to fix them.

After enough time coordinating deliveries through Slack threads, I started writing down every friction point I ran into personally. Not hypothetically. Things that slowed me down, caused miscommunication, or made me feel like I was flying blind. Then I taught myself enough Go and Next.js to build a solution using the same stack Ever's engineering team uses.

This is that solution.

---

## My Experience on the Floor

On any given day I might be:

- Prepping a vehicle for an ON-SITE delivery where the customer is physically in the building
- Receiving a vehicle that just came off transport and logging its condition
- Shuttling a car to Roberts Tires for a repair and picking up another one when it's done
- Getting pulled mid-task to help a teammate who is underwater

All of this coordination happened in Slack. Every update I sent — "Otw to EA 15%", "In line at car wash, 6 cars ahead of me", "Vehicle fully prepped, staged in HQ, 80%, keys in 1micro" — was a manual message typed into a thread that most of the team had already lost.

I watched Patrick spend part of his day copy-pasting thread links into DMs just to hand off work. I watched teammates miss their own assignments because the notification cleared. I watched customers wait longer than they needed to because nobody could see at a glance where their car was.

I decided to fix it.

---

## Every Problem I Identified and How I Solved It

### 1. Nobody could find what they were working on

**The problem:** Slack notifications clear. Once you tap out of a thread, it is effectively gone unless you saved it or someone tags you again. I talked to teammates who described opening Slack and genuinely not knowing which vehicle they were supposed to be working on that day.

**My thought process:** The fix is not a better Slack setup. It is a dedicated view that shows you exactly your tasks the moment you open the app — no searching, no scrolling, no waiting to be tagged. I built the Specialist view with this as the primary principle. You open the app, you see your name, you see your tasks, sorted by urgency. That is it.

---

### 2. Delivery status was buried inside 35-reply threads

**The problem:** To know where any delivery stood — whether a vehicle was blocked, charged, prepped, or ready — you had to open the thread and read every reply. There was no at-a-glance view. Patrick managed this by keeping mental notes and following up manually.

**My thought process:** I mapped out the actual stages every vehicle moves through before it reaches the customer. The pipeline is always the same: Requested → Ready for Sale → Boarded → Prepped → Ready for Delivery. I turned that into a visual pipeline with large tappable circles — REQ, RFS, BRD, PREP, RFD — that anyone can read in under a second. Green means done. Purple means current. Red means blocked. You never have to open a thread to know where a car is.

I also separated "Blocked" from the pipeline stages intentionally. Blocked is not a stage — it is a state that sits on top of a stage. So the pipeline always shows position, and a separate red banner shows the specific blocker. That distinction matters operationally.

---

### 3. Status updates were free-text messages with no structure

**The problem:** Every location and charge update was typed manually:
```
"Otw to EA 15%"
"In line at car wash, 6 cars ahead of me"
"At EA, charge won't connect, trying another port"
```
This data existed only as unstructured text. You could not query it, aggregate it, or build anything on top of it.

**My thought process:** I listed every location our team actually uses — HQ, Morris, EA Charging, OTW to EA, OTW to Detail, Staged at Detail, In line at Car Wash, At Car Wash, OTW to HQ — and turned them into a one-tap picker. Same for charge level: 15%, 25%, 50%, 80%, 100%. When you tap either pill on your task card, a dropdown appears. You tap your selection. It updates the card and automatically logs the update in the activity thread with a timestamp — just like your Slack message, but structured and one tap instead of typing.

This is the detail I am most proud of. It replaces the most common Slack messages our team sends. It is faster, it is structured, and it is undoable.

---

### 4. There was no ping system — just manual @mentions

**The problem:** When I needed help — charger not working, key missing, customer standing there — I had to type a full message, tag the right person, and hope they saw it in time. There was no standard format. Every escalation looked different.

**My thought process:** I built two dedicated ping flows. One sends a pre-formatted alert to ops-management with the vehicle, customer, current location, and issue type. One notifies the salesperson who submitted the deal so they can manage the customer directly. You pick a template — Charging issue, Key missing, Customer here — and the message writes itself. One tap sends it to Slack. The message is always structured the same way so Patrick can read it in under three seconds.

---

### 5. The final delivery checklist was a Slack workflow nobody could track

**The problem:** The Ops Delivery Checklist — 7 cleanliness confirmations, TLP verification, ROS windshield installation, charger type, 14 required photos — was triggered as a Slack workflow and tracked nowhere. Completion was signaled by a ✅ emoji reaction. If you missed it, there was no record.

**My thought process:** I baked the checklist directly into the delivery card. Every item is a checkbox. The card shows completion percentage in a progress bar. The submit button is locked until the minimum requirements are met. Mark complete replaces the ✅ emoji — and it has an undo button, because mistakes happen under pressure and you should not need to re-open a workflow to fix one.

---

### 6. Three roles, three different workflows, one chaotic channel

**The problem:** Inventory specialists, ingress specialists, and shuttling specialists all coordinated through the same Slack channels. The work is completely different. Ingress is receiving vehicles and logging condition. Inventory is preparing vehicles for delivery. Shuttling is moving vehicles between vendors. Mixing all three in one channel created noise for everyone.

**My thought process:** I built three completely separate dashboards — one per role — accessible through a bottom tab navigation. Each dashboard is designed specifically for that role's actual workflow.

- **Inventory:** Delivery pipeline, RFS check, final checklist, location/charge pickers, ping system
- **Ingress:** Vehicle receiving form (VIN, mileage, colors, keys, charge, charger, warning lights, damage), photo upload tracker (minimum 5 photos required: dash, interior, door sticker, emissions, exterior), one-tap Mark Inbounded button
- **Shuttling:** Trip cards showing vehicle, origin → destination, vendor, trip type (drop-off/pickup/both), three-stage pipeline (Pending → En Route → Complete)

Specialists can freely switch between tabs because roles shift day to day. Your assigned role gets a visual indicator but does not lock you out of anything.

---

### 7. Patrick assigned tasks by copy-pasting thread links into DMs

**The problem:** Every morning Patrick manually figured out who was doing what, then communicated assignments through direct messages, thread links, and verbal handoffs. There was no system. If Patrick was busy, assignments did not happen and people defaulted to whatever they found in the channel.

**My thought process:** I built the Advisor view as a drag-and-drop assignment board. The left side has three role zones — Ingress, Inventory, Shuttling — each showing assigned team members as chips and all active tasks below them. The right side is a sticky team roster panel showing everyone by name, current assignment, and availability. You drag a name from the panel and drop it into a role zone. The assignment is instant. Auto-assign distributes everyone by workload and urgency in one click. Every reassignment has an undo.

The task lists under each role zone show every active task with full detail — vehicle, customer, stage, charge level, location, blockers, photo count, trip route — so Patrick can see the entire operation without opening a single thread.

---

### 8. Vehicles not in today were invisible

**The problem:** When a specialist called out, Patrick still had to mentally track who was available and redistribute their tasks. There was no roster view.

**My thought process:** The team panel in the Advisor view shows everyone in the organization. People marked "in today" are full color and draggable. People who are out are greyed out at the bottom of the panel, clearly separated, not assignable. The header shows the count — "8 in · 2 out" — so Patrick knows capacity before he starts assigning anything.

---

## The Architecture

I built this on the same stack Ever's engineering team uses — Go for the backend, Next.js for the frontend — deliberately, so the codebase is readable and extendable by the people who will maintain it.

```
ever-dashboard/
├── backend/        # Go REST API
│   ├── main.go     # Typed data models + HTTP server
│   └── go.mod
└── frontend/
    └── app/
        └── page.tsx  # Role-based React dashboard
```

**Go backend** — I defined typed structs for every entity: `Delivery`, `Checklist`, `Comment`, `DeliveryStatus`. The `json:"..."` tags control serialization. CORS is enabled so the Next.js frontend can talk to the API across ports. The current data store is in-memory — a `[]Delivery` slice — which is intentional for a prototype. The API contract is defined. Swapping in PostgreSQL does not change a single route handler.

**Next.js frontend** — TypeScript throughout. All styles are inline for precision control — no framework fighting the design. Fixed-position dropdowns use `getBoundingClientRect()` to calculate position at runtime, which prevents clipping inside overflow-hidden containers (a real bug I debugged and fixed during development). Optimistic UI updates with undo on every destructive action — complete, flag, stage change, role reassignment.

---

## Running It

```bash
# Clone
git clone https://github.com/acevenen/ever-dashboard.git
cd ever-dashboard

# Start the Go API (terminal 1)
cd backend
go run main.go
# API running at http://localhost:8080

# Start Next.js (terminal 2)
cd ../frontend
npm install && npm run dev
# Dashboard at http://localhost:3000
```

Verify the API: `http://localhost:8080/deliveries`
Open the dashboard: `http://localhost:3000`

---

## What Comes Next

These are the things I know need to happen to make this production-ready:

- **PostgreSQL** — replace the in-memory slice with a real database. The Go structs are already the schema.
- **`PATCH /deliveries/:id/status`** — persist stage changes from the frontend
- **`POST /deliveries/:id/ping`** — send structured Slack messages via the Slack API when specialists flag for help
- **Authentication** — role-based login so the app knows whether to show the specialist or advisor view automatically
- **Photo upload** — S3 or Cloudflare R2 with minimum photo count enforcement per workflow
- **Google Sheets sync** — the advisor vehicle tracker tab pulls from the existing tracker via the Sheets API, replacing the manual sheet entirely
- **Push notifications** — when Patrick assigns you a task, your phone pings. No more waiting to be tagged in Slack.
- **Deploy** — Railway for Go, Vercel for Next.js. A real URL the team can open on their phones tomorrow.

---

## The Point

I am not trying to replace Slack. I am trying to build a layer on top of the workflow that already exists — one that makes the information structured, the actions one tap, and the status visible to everyone without opening a single thread.

I built this because I have done this job. I know which Slack messages I send ten times a day. I know what Patrick looks at when he is trying to figure out if a delivery is on track. I know what it feels like to have a customer standing in the showroom while you are digging through a 35-reply thread trying to find out if the car is charged.

That is the problem. This is the solution. I want to build the rest of it with the engineering team.

---

*Ace Venenciano · Inventory Specialist → Software Engineer · Ever Cars SF*