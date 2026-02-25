---
folder: patch_notes
---

Extract Azur Lane patch notes. **ONE date at a time.**

Extract ONLY ships/equipment from SHOPS or EVENTS. Ignore: Island Planner, FleetChat, Private Quarters.

**Output Format:**

# YYYY-MM-DD

## Ships

- **Ship Name**: Shop/Event context (1-2 sentences)

## Equipment

- **Equipment Name**: Shop/Event context

## Other

- **Meowfficer Name**: Shop/Event context

---

**INCLUDE if from these contexts:**

- **SHOPS**: PT shop, Exchange shop, Event shop, Medal shop, Core Data shop, Merit shop, etc.
- **EVENTS**: Event construction pool, Event rewards, Event missions, Limited-time events, META Showdown, Dossier Analysis, War Archives, Cruise Missions
- **AUGMENT MODULES**: Unique Augments ONLY (gear tied to 1 specific ship)
- **GEAR LAB**: New research projects

**Examples:** "Get HMS Hood from PT shop", "Event construction: USS Enterprise, HMS Warspite", "Yorktown II in UR Exchange", "META Showdown (limited)", "War Archives: Violet Tempest added", "Augment: Alabama – Anchor of Fortune"

---

**EXCLUDE (even if mentions gear/ship):**

- **PACKS/BOXES/SUPPLIES**: Skill Book Pack, Lucky Box, Build Supplies, etc.
- **VOUCHERS/TOKENS**: Miraculous Idea, Medals (unless exchanging for specific ship/equipment)
- **MISC CONSUMABLES**: Wisdom Cubes, Coins, Oil, Cognitive Chips, etc.
- **SKINS**: ALL skins, costumes, L2D, Secret items
- **DECORATIONS**: Decor Tokens, Furniture
- **MATERIALS**: Build Tickets, Augment Module Core/Stone, Tech Box
- **GENERAL CONTENT**: UI fixes, bug fixes, balance changes

**Rules:**

- If nothing qualifies: "_No shop/event ships or equipment mentioned._"
- Date header must match input date
- Context: specify shop/event (max 1-2 sentences)
- If event has ships but no equipment mentioned → add note to equipment section to verify in-game
