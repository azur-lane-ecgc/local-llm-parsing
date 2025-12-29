You are analyzing Azur Lane patch notes from blog posts.

**You will receive ONE date's worth of patch notes at a time.**

Your task: Extract ONLY ships and equipment that are available through SHOPS or EVENTS.

**Output Format: MARKDOWN**

Create a markdown document for this date only.

# YYYY-MM-DD

## Ships

- **Ship Name**: Shop/Event context (1-2 sentences)
- **Ship Name**: Shop/Event context

## Equipment

- **Equipment Name**: Shop/Event context
- **Equipment Name**: Shop/Event context

---

**CRITICAL INCLUSION RULES:**

**ONLY include if the ship/equipment is mentioned in these contexts:**

- **SHOPS**: PT shop, Exchange shop, Event shop, Medal shop, Core Data shop, Merit shop, etc.
- **EVENTS**: Event construction pool, Event rewards, Event missions, Limited-time events, META Showdown, Dossier Analysis, War Archives, Cruise Missions, etc.
- **AUGMENT MODULES**: Unique Augment Modules ONLY. These are gear tied to 1 specific ship, usually added permanently but can be limited-time.
- **GEAR LAB**: Gear Lab updates, new research projects

**EXAMPLES of what to INCLUDE:**

- "Get HMS Hood from the PT shop"
- "Limited gear 'Director's Screenplay' available in event shop"
- "New Gear Lab research project unlocks 'Anti-Torpedo Bulge'"
- "Event construction pool includes: USS Enterprise, HMS Warspite"
- "Exchange ship: Yorktown II available in UR Exchange"
- "Obtainable from META Showdown for a limited-time between..."
- "Available permanently in Dossier Analysis"
- "War Archives Update: 'Violet Tempest, Blooming Lycoris' has been added to the War Archives."
- "Augment Update: Alabama – Anchor of Fortune, Myoukou – Protector of Order"
- "META ship available in Cruise Missions"

**STRICT EXCLUSION RULES:**

**NEVER include these - even if they mention "gear" or "ship":**

- **PACKS**: "Skill Book Pack", "Supply Crate", "Resource Pack", "Gift Pack", etc.
- **BOXES/LUCKY BOX**: "Lucky Box", "Gear Skin Box", "Mystery Box", etc.
- **SUPPLIES**: "Build Supplies", "Strategic Supplies", "Training Supplies", "Limited Build Supplies", etc.
- **VOUCHERS/TOKENS**: "Miraculous Idea", "Medals", "Tokens" (unless exchanging for specific ship/equipment), etc.
- **MISC CONSUMABLES**: "Wisdom Cubes", "Coins", "Oil", "Bauxite", "Cognitive Chips", etc.
- **SKINS**: ALL skin mentions, costume mentions, L2D mentions, Secret mentions, etc.
- **DECORATIONS**: "Decor Tokens", "Furniture", "Room items", etc.
- **GENERAL GAME CONTENT**: UI fixes, bug fixes, balance changes not tied to shops/events
- **MATERIALS**: "Build Tickets", "Strategic Tickets", "Training Tickets", "Augment Module Core", "Augment Module Stone", "Tech Box", etc.

**SHIPS - Only include if from shop/event:**
✓ Include: PT shop rewards, Event construction pool, Exchange shops (Core Data, Merit, etc.), Event missions, META Showdown, Dossier Analysis, War Archives, etc.
✗ Exclude: All skin mentions, l2d mentions, cosmetic changes, bug fixes, etc.

**EQUIPMENT - Only include actual gear from shop/event:**
✓ Include: Specific named equipment in shops, Gear Lab unlocks, Event reward gear. If an Event is mentioned that has ships, but no equipment is mentioned, add a note to the equipment section to double check in-game if there is equipment or not.
✗ Exclude: Packs, supplies, boxes, tokens, general upgrade items

**Additional Rules:**

- If you are unsure on what constitutes a 'ship' or 'equipment' that is relevant, all of these ships and equipment are on official documentation, as such a simple web search should be good enough to determine.
- Create ONE document for the date provided
- If nothing meets the criteria, write: "_No shop/event ships or equipment were mentioned in this patch note._"
- Use clear markdown formatting (headings, bolding, lists, tables, etc.)
- Date header must match the date in the input
- Context: specify which shop or event (max 1-2 sentences)
