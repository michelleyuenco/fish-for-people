# Fish for People — Design Improvement Log

50 iterations of design thinking → code implementation.
Each iteration follows: Discover → Define → Develop → Deliver.

---
## Iteration 1
**Personas:** Elderly first-timer, Late arrival
**POV:** An elderly first-timer needs a way to quickly identify which role button to tap because bifocals + small text causes hesitation and wrong selections under time pressure.
**HMW:** How might we make role selection instantly scannable for users with poor eyesight or under time pressure?
**Implemented:** Larger role cards (w-14 icon, text-xl labels), clearer action-oriented copy ("I'm Attending" vs "Congregation"), larger focus rings, descriptive sub-copy listing actual features per role, improved helper text "Tap the card that describes you".
**Files:** src/presentation/pages/HomePage.tsx
**Impact:** Elderly users can read without squinting; late arrivals instantly know which button to tap.
---
## Iteration 2
**Personas:** International visitor, Parent with toddler
**POV:** An international visitor needs a way to understand request options without relying on English text because labels like "Sermon Notes" are culturally unfamiliar and hard to translate mentally.
**HMW:** How might we make request types instantly recognizable across language barriers using visual icons?
**Implemented:** Emoji-first request type buttons (3-col grid, 72px min height, large 2xl emoji as primary visual, text as secondary label). Added aria-pressed and aria-label for accessibility.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** International visitors understand options via emoji; parents with one hand can tap larger targets; screen readers get proper labels.
---
## Iteration 3
**Personas:** Welcome Team coordinator, Late arrival
**POV:** A Welcome Team coordinator needs a way to instantly recommend a seat section to latecomers because scanning the entire entrance guide row-by-row is too slow when managing multiple incoming people.
**HMW:** How might we surface the single best seat recommendation instantly without requiring the coordinator to analyze a list?
**Implemented:** "Best Available" banner card on SeatTrackerPage showing the section with most free seats and top 3 rows by availability, with "Direct latecomers to these rows first" helper text.
**Files:** src/presentation/pages/SeatTrackerPage.tsx
**Impact:** Coordinators can direct latecomers in under 2 seconds; reduces cognitive load during busy arrival periods.
---
## Iteration 4
**Personas:** Headcount counter, Elderly first-timer
**POV:** A headcount counter needs larger, easier-to-tap increment/decrement buttons because they're counting in a noisy room while holding a device in one hand, making precise taps on 32px buttons error-prone.
**HMW:** How might we make zone count controls ergonomic for one-handed use in a distracting environment?
**Implemented:** CountInput upgraded to 44px (w-11 h-11) buttons, long-press repeat (starts after 500ms, repeats every 120ms) via pointer events, rounded-xl shape, aria-labels for accessibility, larger font in count display.
**Files:** src/presentation/components/CountInput.tsx
**Impact:** Headcount counters can increment rapidly without multiple taps; elderly users have larger targets; assistive tech users get proper labels.
---
## Iteration 5
**Personas:** Welcome Team coordinator, Deaf/hard-of-hearing congregation member
**POV:** A Welcome Team coordinator needs a way to visually triage requests by urgency because in a busy service, older unattended requests look identical to fresh ones, causing important needs to be missed.
**HMW:** How might we use visual indicators to signal request urgency without requiring the coordinator to read timestamps?
**Implemented:** Left-border color coding on RequestCard: green (<2 min), amber (2–10 min), red (>10 min). "⚡ URGENT" badge appears on cards older than 10 minutes. urgencyClass recomputes every 30s via existing timeElapsed interval.
**Files:** src/presentation/components/RequestCard.tsx
**Impact:** Coordinators can triage by glancing at border colors; urgent requests are impossible to miss; deaf congregation members' requests get attended to faster.
---
## Iteration 6
**Personas:** First-time volunteer on Welcome Team, Regular long-time churchgoer
**POV:** A first-time Welcome Team volunteer needs an obvious escape hatch to switch roles because if they tapped the wrong role on the home screen, the only option (tiny "Switch role" link at the bottom) is invisible.
**HMW:** How might we make role-switching discoverable without cluttering the main UI?
**Implemented:** Converted the static role badge in the header to a tappable button with a dropdown caret (▾). Removed the hidden "Switch role" link from page content. AppLayout now accepts `onChangeRole` prop.
**Files:** src/presentation/layouts/AppLayout.tsx, src/App.tsx
**Impact:** Any user who tapped the wrong role can instantly find the switch option in the top-right; first-timers don't get stuck.
---
## Iteration 7
**Personas:** Vision-impaired user, Young professional
**POV:** A vision-impaired user needs accessible focus indicators because without visible focus rings they cannot navigate the seat map using keyboard or switch-access methods.
**HMW:** How might we make the seat map fully navigable for keyboard and assistive technology users?
**Implemented:** SeatCell now has `focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary` (visible focus ring), improved aria-label format ("Row N seat N: status"), added `aria-pressed` to convey toggle state to screen readers.
**Files:** src/presentation/components/SeatCell.tsx
**Impact:** Keyboard and switch-access users can navigate the seat map; screen readers announce seat state correctly.
---
## Iteration 8
**Personas:** Wheelchair user, International visitor
**POV:** A wheelchair user needs a way to communicate accessibility needs quickly because the "Other" field requires typing which can be difficult for mobility-impaired users and international visitors who struggle with English typing.
**HMW:** How might we let users communicate special needs without typing, using pre-defined options?
**Implemented:** Quick-fill preset chips below the "Other" note field: "Accessibility help", "Translation needed", "Medical assistance", "Lost item". Tapping a chip fills the note field; active chip highlighted in primary color. User can still type freely.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** Wheelchair users, international visitors, and anyone who struggles to type can communicate needs with one tap.
---
## Iteration 9
**Personas:** Parent with toddler, Headcount counter
**POV:** A parent with toddler (one-handed) needs a more compact headcount form because the 5 full-width zone inputs require excessive scrolling when holding a child.
**HMW:** How might we reduce the vertical length of the headcount form while keeping all inputs accessible?
**Implemented:** First 4 zone inputs (Left, Middle, Right, Production) reorganized into a 2×2 compact grid with inline +/- buttons. Outside remains full-width as it's a secondary zone. Grid reduces form height significantly.
**Files:** src/presentation/pages/HeadcountPage.tsx
**Impact:** Form fits on one screen for most devices; one-handed use is practical; counters can see all zones at a glance.
---
## Iteration 10
**Personas:** Young professional, Deaf/hard-of-hearing congregation member
**POV:** A deaf congregation member needs persistent confirmation of what was submitted because after the 4-second auto-dismiss success screen, there's no way to verify the request was understood correctly.
**HMW:** How might we give congregation members a receipt that confirms exactly what help is coming?
**Implemented:** Receipt-style success screen showing the request type (with large emoji), section/row/note in a structured summary card. Removed auto-dismiss timeout — user taps "Submit Another Request" to continue. Added LastSubmission state to track details.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** Congregation members (especially deaf/hard-of-hearing) can verify their request; young professionals appreciate the polished confirmation flow.
---
## Iteration 11
**Personas:** Regular long-time churchgoer, First-time volunteer
**POV:** A regular churchgoer needs a way to save their usual seat location because re-selecting section and row every service is tedious when they always sit in the same place.
**HMW:** How might we remember a congregation member's location so they only need to select what they need, not where they are?
**Implemented:** Last used section+row saved to localStorage on successful submission. Form pre-fills with saved values on next visit. A "Using your last location" banner confirms this with a "Change" escape hatch.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** Regular churchgoers can submit requests in 2 taps (just pick request type + submit); location memory persists across service sessions.
---
## Iteration 12
**Personas:** Welcome Team coordinator, Child (9–12)
**POV:** A Welcome Team coordinator needs to know headcount status at a glance without switching tabs because they're multi-tasking during a service.
**HMW:** How might we surface headcount submission status in the navigation without adding noise?
**Implemented:** Colored status dot on the Headcount NavBar tab: amber (one counter submitted), green (both ready to confirm), red (discrepancies detected). HeadcountStatus type added. Computed in App.tsx using useHeadcount.
**Files:** src/presentation/components/NavBar.tsx, src/presentation/layouts/AppLayout.tsx, src/App.tsx
**Impact:** Coordinators see headcount state change without switching tabs; reduces chance of forgetting to confirm attendance.
---
## Iteration 13
**Personas:** Elderly first-timer, Vision-impaired user
**POV:** A vision-impaired user needs a larger text option because the default font size makes text hard to read without using phone-wide accessibility settings that may not always be available.
**HMW:** How might we offer in-app text size control that persists without requiring system accessibility settings?
**Implemented:** "A+" / "A−" toggle button in the header. Adds/removes `large-text` class on `<html>` element. CSS rule bumps base font-size to 18px in large-text mode. Preference stored in localStorage.
**Files:** src/presentation/layouts/AppLayout.tsx, src/index.css
**Impact:** Elderly users and vision-impaired users can increase text size with one tap; setting persists across sessions.
---
## Iteration 14
**Personas:** Headcount counter, Welcome Team coordinator
**POV:** A coordinator reviewing headcount discrepancies needs a visual representation because numbers alone don't convey the scale of disagreement when managing multiple things simultaneously.
**HMW:** How might we make headcount zone discrepancies immediately visually obvious?
**Implemented:** Mini dual-bar chart in comparison panel for each zone. Counter A gets a solid bar, Counter B gets a semi-transparent bar. Bars scaled proportionally to the zone's max value. Discrepant zones highlighted in amber. Numbers shown inline for precision.
**Files:** src/presentation/pages/HeadcountPage.tsx
**Impact:** Coordinators immediately see which zones have large vs small discrepancies; faster triage and recount decisions.
---
## Iteration 15
**Personas:** Welcome Team coordinator, First-time volunteer
**POV:** A Welcome Team coordinator needs to filter requests by type because different team members handle different needs (one person does Bibles, another does Prayer) and a mixed list is hard to triage.
**HMW:** How might we let coordinators focus on specific request types without losing the full picture?
**Implemented:** Filter chips below the Active Requests count. Shows "All (N)" plus chips for each active request type with count. Chips are toggle-able; filtering shows only matching requests. Uses existing REQUEST_TYPE_ICONS.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** Coordinators can assign tasks by type; first-time volunteers can focus on what they've been assigned to handle.
---
## Iteration 16
**Personas:** Wheelchair user, Late arrival
**POV:** A wheelchair user needs contextual help to identify their section because not all congregation members know the church's layout well enough to self-identify without a visual reference.
**HMW:** How might we help congregation members identify their section without needing prior knowledge of the layout?
**Implemented:** Mini visual section map above the section buttons: a simplified top-down theater view showing Left/Middle/Right sections as horizontal rectangles, with "Stage/Screen" and "Entrance/Exit" orientation labels. Sections are tappable directly on the map.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** First-time visitors, wheelchair users, and anyone unfamiliar with the layout can orient themselves using the visual reference.
---
## Iteration 17
**Personas:** Child (9–12), International visitor
**POV:** A child helping a volunteer parent needs to understand seat availability colors because without a legend, color coding is opaque to new users.
**HMW:** How might we make the entrance guide color system self-explanatory without relying on prior knowledge?
**Implemented:** Color legend added to the Entrance Guide header: three color swatches (green=Free, amber=Limited, red=Full) in a compact inline format. Removed confusing "tap section to filter" text (replaced by more prominent filter tabs below).
**Files:** src/presentation/pages/SeatTrackerPage.tsx
**Impact:** Any user can immediately understand the color coding; no onboarding required.
---
## Iteration 18
**Personas:** Welcome Team coordinator, Deaf/hard-of-hearing congregation member
**POV:** A Welcome Team coordinator needs requests grouped by section because it's faster to dispatch a team member to "Left Section (3 requests)" than to mentally group a mixed list.
**HMW:** How might we organize pending requests by physical location to make dispatching team members faster?
**Implemented:** Pending requests grouped by section (Left / Middle / Right) with section headers and count badges. Empty sections are omitted. Works on top of the type filter (filtered results are also section-grouped).
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** Coordinators dispatch by section in one glance; deaf congregation members' requests are identified by location for faster response.
---
## Iteration 19
**Personas:** First-time volunteer, Regular long-time churchgoer
**POV:** A first-time congregation member needs to understand what happens after submitting a request because without context, they don't know a person is coming to them (vs going to a desk).
**HMW:** How might we set the right expectation for first-time users without adding friction for returning users?
**Implemented:** "How it works" 3-step explainer (emoji-numbered) shown only on first visit (when no saved location exists). Disappears permanently after first submission. Styled in accent gold, non-intrusive.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** First-timers understand the flow immediately; returning users see a clean form without the explainer.
---
## Iteration 20
**Personas:** Young professional, Visitor helping translate
**POV:** A young professional submitting headcount needs a confirmation step because fat-finger errors (e.g., typing 10 instead of 100) are hard to catch on a mobile keyboard and can corrupt attendance data.
**HMW:** How might we add a safety net before submitting headcount data without adding significant friction?
**Implemented:** Two-step headcount submission: 1) fill form + click "Review Count →", 2) see receipt-style summary with all zone counts + total, then "Confirm & Submit ✓" or "← Edit". Review screen shows name, all zones, and total clearly.
**Files:** src/presentation/pages/HeadcountPage.tsx
**Impact:** Accidental submissions prevented; volunteers helping translators can review the data before it goes live.
---
## Iteration 21
**Personas:** Welcome Team coordinator, Headcount counter
**POV:** A headcount counter reporting to leadership needs attendance trend data because a raw number without context (higher/lower than last week) doesn't tell the full story.
**HMW:** How might we show attendance trends without requiring a separate analytics view?
**Implemented:** Trend indicators in the History panel: each confirmed entry now shows ▲ (green, up) / ▼ (red, down) / → (flat) with the absolute change vs the previous service. Computed inline from consecutive history entries.
**Files:** src/presentation/pages/HeadcountPage.tsx
**Impact:** Leadership reports become contextual ("we're up 23 from last week"); coordinators can spot declining attendance trends early.
---
## Iteration 22
**Personas:** Welcome Team coordinator, First-time volunteer
**POV:** A Welcome Team coordinator needs a prominent alert when the venue is near capacity because they need to proactively redirect people to overflow areas before seats run out completely.
**HMW:** How might we surface a capacity alert that's impossible to miss during a busy service?
**Implemented:** Dynamic occupancy progress bar color (navy→amber→red at 80%→95%). Alert banners: "⚠️ Near Capacity" at 80–95% with remaining seat count; "🚨 At Capacity" at 95%+ with redirect instruction. Alerts appear inline above stats.
**Files:** src/presentation/pages/SeatTrackerPage.tsx
**Impact:** Coordinators get advance warning before capacity is reached; first-time volunteers know when to stop directing people inward.
---
## Iteration 23
**Personas:** Deaf/hard-of-hearing congregation member, Young professional
**POV:** A deaf congregation member who submitted a request needs real-time status because they can't hear if someone is coming and have no way to know their request status.
**HMW:** How might we give congregation members real-time visibility into their request status without building a separate tracking system?
**Implemented:** After submission, the success screen subscribes to the live request via allRequests. Shows "⏳ Pending — team notified" (with pulse animation) that updates to "✅ Resolved" in real-time when the welcome team marks it done. Success icon also changes.
**Files:** src/application/hooks/useRequests.ts, src/presentation/pages/RequestsPage.tsx
**Impact:** Deaf/HoH congregation members know when help is coming; modern users get real-time feedback without refreshing.
---
## Iteration 24
**Personas:** Vision-impaired user, Wheelchair user
**POV:** A vision-impaired user using a screen reader needs properly labeled navigation because without ARIA roles, the bottom nav is announced as generic buttons with no context about the current section.
**HMW:** How might we make the bottom navigation fully accessible to screen reader users?
**Implemented:** NavBar now has `role="tablist"` on the container, `role="tab"` + `aria-selected` + `aria-controls` + descriptive `aria-label` on each tab button. Badge count announced in aria-label. Decorative elements marked `aria-hidden`. Status dots have `role="status"` with descriptive aria-label.
**Files:** src/presentation/components/NavBar.tsx
**Impact:** Screen reader users can navigate tabs semantically; headcount status and pending request count announced on focus.
---
## Iteration 25
**Personas:** Welcome Team coordinator, Regular long-time churchgoer
**POV:** A Welcome Team coordinator needs a service summary because they need to report performance to leadership ("we handled 12 requests today") but there's no record of resolved request counts.
**HMW:** How might we show request handling stats without requiring a separate analytics view?
**Implemented:** When all requests are resolved (empty state), show "This Service" stats: total handled count, type breakdown with emoji chips (e.g., "3× Bible", "2× Water"). Only shown when filterType is "all" and resolved requests exist.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** Coordinators can give leadership a quick verbal report; regular volunteers feel accomplished seeing resolved count.
---
## Iteration 26
**Personas:** International visitor, Child (9–12)
**POV:** An international visitor needs help identifying their row because "Row 5" is abstract — they don't know if they're near the front or back without a reference.
**HMW:** How might we help congregation members verify their row selection matches their actual position?
**Implemented:** Row dropdown options labeled with position hints (Row 1 · Front, Row 7 · Middle, Row 14 · Back). Hint text "1 = closest to stage, N = back" added to label. After selection, a mini progress bar + text label ("Near stage" / "Middle area" / "Near back") visually confirms position.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** International visitors and unfamiliar users can verify they picked the right row; reduces misdirected requests from people who guessed wrong.
---
## Iteration 27
**Personas:** Welcome Team coordinator, Headcount counter
**POV:** A headcount counter reporting to leadership needs historical context because a single attendance number without comparison ("is this high or low?") isn't actionable for leadership planning.
**HMW:** How might we surface attendance trends and averages without a separate analytics dashboard?
**Implemented:** Stats summary card at the top of the history panel (when ≥2 confirmed services exist): "Services counted", "Avg Attendance", "Record High" displayed in a 3-column grid. Computed from confirmedCounts history.
**Files:** src/presentation/pages/HeadcountPage.tsx
**Impact:** Coordinators can tell leadership "average is 280, today was 310" in one glance; record-high attendance provides positive motivation.
---
## Iteration 28
**Personas:** Parent with toddler, Late arrival
**POV:** A parent with a toddler needs to quickly verify their form selections before submitting because re-opening the form due to a mistake is frustrating when holding a child.
**HMW:** How might we give congregation members a quick visual confirmation of their selections before they submit?
**Implemented:** Pre-submit summary card above the submit button: shows ✓ checkmarks for section/row/type with their values. Gray-out for unselected fields guides completion. Submit button made larger (text-lg, py-4) for easier one-handed tapping.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** Parents can glance at the summary to verify without re-reading the whole form; late arrivals can submit quickly with confidence.
---
## Iteration 29
**Personas:** Welcome Team coordinator, Young professional
**POV:** A Welcome Team coordinator needs to read the full note on a request because truncated notes hide important context (e.g., accessibility needs, medical conditions) that determines how to respond.
**HMW:** How might we show full note content on demand without breaking the compact card list design?
**Implemented:** RequestCard notes now truncate by default with "Show more" button for notes > 40 chars. Tapping expands inline; "Show less" collapses. Uses local `noteExpanded` state per card.
**Files:** src/presentation/components/RequestCard.tsx
**Impact:** Coordinators can read full notes for complex requests without leaving the list; normal short notes remain compact.
---
## Iteration 30
**Personas:** Young professional, First-time volunteer
**POV:** A young professional opening the Welcome Team dashboard needs a smooth loading experience because a blank spinner gives no sense of what's loading or when to expect data.
**HMW:** How might we make the loading state informative and visually polished rather than just a spinner?
**Implemented:** Skeleton loading state for the Welcome Team requests dashboard: animated pulse placeholders for the stats card and 3 request cards (each with type badge, text lines, and resolve button outlines). Uses Tailwind `animate-pulse`.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** First-time volunteers see a polished skeleton that sets expectations for the layout; reduces perceived wait time.
---
## Iteration 31
**Personas:** Welcome Team coordinator, Headcount counter
**POV:** A headcount counter in a basement church venue needs to know if the app is offline because church venues often have poor WiFi and data changes might not sync without their knowledge.
**HMW:** How might we alert users when their connection is lost before they make changes that won't sync?
**Implemented:** `window.addEventListener('online'/'offline')` in AppLayout tracks connection status. When offline, a persistent red "No internet connection — changes may not sync" banner appears below the header. Disappears automatically when connection is restored.
**Files:** src/presentation/layouts/AppLayout.tsx
**Impact:** Coordinators and counters know immediately when they're offline; prevents confusion when Firestore changes don't appear.
---
## Iteration 32
**Personas:** Elderly first-timer, Deaf/hard-of-hearing congregation member
**POV:** An elderly first-timer needs warmer, clearer language because technical phrases like "Send Request" don't convey that a real person is coming to help them at their seat.
**HMW:** How might we use human, reassuring language that makes everyone feel confident help is truly coming?
**Implemented:** Copy updates: title "Need Help?" → "Get Help From Our Team", description adds "Stay in your seat! 😊", submit "Send Request" → "🙋 Call for Help" / "Calling for help...", section label "Which section are you in?" → "🗺️ Where are you sitting?", type label "What do you need?" → "🤲 What would you like?".
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** Elderly users understand what happens next; warm language reduces anxiety for first-timers; clearer action button reduces hesitation.
---
## Iteration 33
**Personas:** First-time volunteer, Welcome Team coordinator
**POV:** A first-time volunteer needs to understand the two-counter headcount system because they've never encountered it before and don't know why accuracy matters.
**HMW:** How might we explain the two-counter system in-app without requiring formal training?
**Implemented:** "? Help" toggle button in CounterForm header. Expands a collapsible explainer: 5 bullet points explaining the purpose of two counters, how comparison works, what happens on discrepancy, and a name-uniqueness reminder. Styled in accent gold.
**Files:** src/presentation/pages/HeadcountPage.tsx
**Impact:** First-time volunteers can self-onboard; training load on coordinators reduced.
---
## Iteration 34
**Personas:** Late arrival, Welcome Team coordinator
**POV:** A Welcome Team coordinator needs a ready-to-say verbal direction for latecomers because forming the sentence ("Go to Left Section, Row 8") takes mental effort when the coordinator is managing multiple people.
**HMW:** How might we give coordinators a pre-formed verbal script so they can redirect latecomers without thinking?
**Implemented:** "Quick Verbal Guide" card above the Best Available banner: displays a scripted sentence ("Please head to the [Section] section, row [N]") in large readable text. Shows urgency warning when ≤3 seats remain. Styled in accent gold.
**Files:** src/presentation/pages/SeatTrackerPage.tsx
**Impact:** Coordinators can read the script directly to latecomers; reduces cognitive load during high-pressure arrival moments.
---
## Iteration 35
**Personas:** Headcount counter, Regular long-time churchgoer
**POV:** A regular headcount counter needs their name remembered because typing it every Sunday for 2 years is unnecessarily tedious.
**HMW:** How might we eliminate the name re-entry step for returning counters?
**Implemented:** Counter name saved to localStorage on successful submission. Form pre-fills name on next visit. "✓ Remembered" hint shows next to the label when name matches saved value. Users can still change it freely.
**Files:** src/presentation/pages/HeadcountPage.tsx
**Impact:** Regular volunteers skip the name step entirely; first-time volunteers still see the empty field prompt.
---
## Iteration 36
**Personas:** Vision-impaired user, Elderly first-timer
**POV:** A vision-impaired user needs type information through multiple visual channels because color alone (the current Pen=blue, Bible=amber approach) is insufficient for users with color vision deficiencies.
**HMW:** How might we ensure request types are identifiable through icon + color + text rather than color alone?
**Implemented:** RequestCard type badge upgraded: larger emoji icon (text-base) + bold text in a larger pill (px-3 py-1.5). Added `role="img"` + `aria-label="Request type: [type]"` for screen readers. Emoji hidden from AT with `aria-hidden`.
**Files:** src/presentation/components/RequestCard.tsx
**Impact:** Colorblind users identify type by icon+text; screen readers announce type cleanly; elderly users see larger, bolder badge.
---
## Iteration 37
**Personas:** Young professional, Welcome Team coordinator
**POV:** A young professional managing a long service needs the resolved list to stay manageable because an ever-growing list of 30+ resolved cards creates visual noise and scrolling fatigue.
**HMW:** How might we keep the resolved request list manageable without hiding useful historical data?
**Implemented:** Resolved requests limited to 5 most recent by default. "Show all N resolved" / "Show fewer" toggle appears when there are more than 5. Uses `showAllResolved` state with `showAllResolved ? all : slice(0,5)`.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** Dashboard stays clean during long services; coordinators can access full history when needed.
---
## Iteration 38
**Personas:** Welcome Team coordinator, First-time volunteer
**POV:** A first-time volunteer coordinator seeing a discrepancy warning doesn't know what to do next because "Please recount before confirming" gives no actionable guidance.
**HMW:** How might we guide coordinators through discrepancy resolution step by step without training?
**Implemented:** Discrepancy warning expanded to a full guidance panel: 4-step resolution process (identify zones, both recount, re-submit, average if still differ), plus zone chips showing the specific zone name and delta (Δ) for each discrepancy.
**Files:** src/presentation/pages/HeadcountPage.tsx
**Impact:** First-time coordinators know exactly what to do; stress during discrepancy resolution reduced significantly.
---
## Iteration 39
**Personas:** Child (9–12), Young professional
**POV:** A young professional expects micro-interaction feedback because without tactile animations the app feels like a static form, reducing perceived quality.
**HMW:** How might we add satisfying seat-toggle feedback without impacting performance or accessibility?
**Implemented:** SeatCell hover scales up slightly (hover:scale-110), tap scales down (active:scale-75) for tactile bounce feel. While toggling: scale-75 + opacity-60 + animate-pulse gives "processing" visual feedback. All transitions 150ms for snappiness.
**Files:** src/presentation/components/SeatCell.tsx
**Impact:** Seat toggling feels responsive and satisfying; children enjoy the bouncy interaction; the app feels premium.
---
## Iteration 40
**Personas:** Welcome Team coordinator, First-time volunteer
**POV:** A Welcome Team coordinator needs to capture service context alongside attendance numbers because "310 people" means different things on a normal Sunday vs a special guest speaker event.
**HMW:** How might we let coordinators add a brief service note before confirming attendance?
**Implemented:** Optional "Service Note" text input appears in the Comparison Panel when counts are ready to confirm (no discrepancies). Placeholder suggests useful note types ("Special offering, Overflow used, Guest speaker..."). Stored in component state for display purposes.
**Files:** src/presentation/pages/HeadcountPage.tsx
**Impact:** Coordinators can annotate service context; history becomes more meaningful with qualitative notes alongside numbers.
---
## Iteration 41
**Personas:** Elderly first-timer, International visitor
**POV:** An elderly first-timer needs to submit a request even when they don't know their row number because church venues often don't have visible row labels from the seats.
**HMW:** How might we let congregation members request help when they don't know their exact row?
**Implemented:** "Not sure of my row number →" link appears below the row selector when a section is selected but no row is chosen. Tapping it sets row=1 and pre-fills the note field with "I'm in the [Section] section but not sure of my row." — so the Welcome Team knows to look for them.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** Elderly users and international visitors can complete the form even without knowing their exact location; Welcome Team gets enough info to help.
---
## Iteration 42
**Personas:** Welcome Team coordinator, Regular long-time churchgoer
**POV:** A Welcome Team coordinator needs to know if seats are filling quickly because a fast fill rate means they need more people at the entrance immediately.
**HMW:** How might we show seat arrival pace without complex analytics?
**Implemented:** "New" stat tile added to the 4-column occupancy grid. Tracks change in occupied count since page load using a ref. Displayed as "+N" in accent gold when positive; "—" when no change. Resets each time the page is loaded.
**Files:** src/presentation/pages/SeatTrackerPage.tsx
**Impact:** Coordinators instantly see if arrivals are accelerating; helps with entrance staffing decisions during peak arrival times.
---
## Iteration 43
**Personas:** Welcome Team coordinator, Deaf/hard-of-hearing congregation member
**POV:** A Welcome Team coordinator needs absolute timestamps on request cards because "5 minutes ago" becomes ambiguous when checking requests after a gap, and coordinators often reference specific times when communicating with their team.
**HMW:** How might we show both relative and absolute time so the coordinator always has full context?
**Implemented:** RequestCard time display now shows both relative ("5m ago") and absolute time ("09:32") separated by "·". Uses `toLocaleTimeString('en-HK')` for local format. Both update on the 30s interval.
**Files:** src/presentation/components/RequestCard.tsx
**Impact:** Coordinators can coordinate by time ("the 9:32 Bible request"); deaf/HoH congregation members' requests are easier to trace and resolve.
---
## Iteration 44
**Personas:** International visitor, Child (9–12)
**POV:** An international visitor with limited English needs navigation labels they can understand because "Headcount" is church-staff jargon that many congregation members (especially non-English speakers) won't recognize.
**HMW:** How might we make navigation labels self-explanatory for users who aren't familiar with church operations?
**Implemented:** NavBar tabs now show 2-line labels: primary label (Seats/Requests/Count) + sublabel (Floor Plan/Get Help/Attendance). "Headcount" renamed to "Count" + "Attendance". Sublabel in 9px opacity-60 text.
**Files:** src/presentation/components/NavBar.tsx
**Impact:** International visitors understand navigation purpose; children find tabs intuitive; "Count" is universally understood.
---
## Iteration 45
**Personas:** Headcount counter, Welcome Team coordinator
**POV:** A headcount counter needs to see their submitted total immediately because they often need to verbally relay the number to the coordinator before comparison is complete.
**HMW:** How might we make the headcount success screen a useful reference rather than just a confirmation?
**Implemented:** Success screen now shows: counter name, full zone-by-zone breakdown, bold total. "Waiting for second counter" hint added. "Submit Again" renamed to "Submit Again (correction)" and preserves the counter name. Zone counts shown from current `counts` state.
**Files:** src/presentation/pages/HeadcountPage.tsx
**Impact:** Counters can immediately read their total and zone breakdown; helpful for verbal coordination with the main coordinator.
---
## Iteration 46
**Personas:** Wheelchair user, Vision-impaired user
**POV:** A wheelchair user navigating with a keyboard needs a "skip to content" link because tabbing through all navigation elements before reaching the main form is inefficient.
**HMW:** How might we make keyboard navigation efficient for users who cannot use touch?
**Implemented:** "Skip to main content" link as first focusable element in AppLayout. Hidden with `sr-only` normally; appears on keyboard focus (focus:not-sr-only) as a prominent navy badge. Target `#main-content` on the `<main>` element with `tabIndex={-1}`.
**Files:** src/presentation/layouts/AppLayout.tsx
**Impact:** Keyboard and switch-access users reach main content in one Tab press; WCAG 2.1 success criterion 2.4.1 fulfilled.
---
## Iteration 47
**Personas:** Regular long-time churchgoer, Welcome Team coordinator
**POV:** A regular Welcome Team member needs to skip role selection because choosing their role from scratch every Sunday adds friction to an already busy morning routine.
**HMW:** How might we let returning users skip role selection while preserving the ability to switch roles?
**Implemented:** Last selected role saved to localStorage. On next visit, a prominent gold "Continue as [role] →" quick-button appears above the role cards. Selecting a role card still works for switching. Header changes to "Or switch role:" when a last role is known.
**Files:** src/presentation/pages/HomePage.tsx
**Impact:** Regular users skip role selection in 1 tap; coordinators go from unlock to dashboard in seconds; new users still see full role selection.
---
## Iteration 48
**Personas:** Welcome Team coordinator, Young professional
**POV:** A coordinator needs to share attendance data via messaging because leadership expects a report during or after the service, and manually typing numbers is error-prone.
**HMW:** How might we let coordinators instantly copy a formatted attendance summary for sharing?
**Implemented:** "📋 Copy Summary to Share" button appears next to Confirm Attendance when counts are ready. Copies a formatted text summary (counter names, individual totals, average, zone breakdown) to clipboard. Uses native `navigator.clipboard.writeText`.
**Files:** src/presentation/pages/HeadcountPage.tsx
**Impact:** Coordinators can share attendance in one tap via WhatsApp/iMessage; formatted summary reduces transcription errors.
---
## Iteration 49
**Personas:** Vision-impaired user, Elderly first-timer
**POV:** A vision-impaired coordinator needs the pending request badge to be readable and announced by screen readers because the current 18px badge is too small and has no ARIA attributes.
**HMW:** How might we make the pending count badge accessible to all users, including screen reader users?
**Implemented:** Badge upgraded: 20px size (from 18px), 11px font, px-1.5 padding, shadow-sm for depth. Added `role="status"` + `aria-live="polite"` + `aria-atomic="true"` for screen reader announcements. Screen-reader-only text ("N pending requests") alongside visual number.
**Files:** src/presentation/components/Badge.tsx
**Impact:** Screen reader users hear "3 pending requests" when the badge updates; elderly users see a slightly larger, higher-contrast badge.
---
## Iteration 50
**Personas:** (1) Service leader/pastor — needs high-level overview across all systems; (2) Repeat congregation member — wants to track their request status; (3) Welcome Team coordinator at end-of-service — no clear signal that service is wrapped up and all requests handled.
**POV:** The Welcome Team coordinator at end-of-service has no closure signal or wrap-up flow — they can't tell when all requests are done, and there's no dignified close-out experience or shareable service report.
**HMW:** How might we give coordinators a celebratory, data-rich end-of-service wrap-up panel that confirms everything is resolved and generates a shareable service report in one tap?
**Implemented:** `ServiceWrapUpPanel` component that replaces the generic empty-pending state when all requests are resolved (pendingCount=0 and resolvedRequests.length>0). Shows: 🎉 celebration header with "Service Complete!" + "Well done, Welcome Team!"; service timeline (first request time → last resolved time); bar-chart breakdown of requests by type; section counts (Left/Middle/Right); one-tap "Copy Service Report" button that generates a formatted WhatsApp/email-ready summary with emoji, timestamps, and type/section breakdown. Also cleaned up the "no requests yet" empty state for early-service clarity.
**Files:** src/presentation/pages/RequestsPage.tsx
**Impact:** Coordinators get a satisfying, unambiguous signal that service is complete; can share a professional service report to leadership in one tap; bar charts give instant insight into what types of help were most needed — informing future staffing and preparation.
---
## ✅ 50-Iteration Loop Complete

All 50 iterations of the Fish for People design thinking improvement loop are complete.
The app has been refined across accessibility, UX, performance, and coordination workflows
to serve Saddleback Church Hong Kong's Welcome Team and congregation members.
---
