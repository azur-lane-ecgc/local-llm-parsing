---
folder: server-news-list
---

I want to transform some news to a given format. The news is for a mobile game about warships called Azur Lane. The given format is written in MediaWiki wiki markup. While I do not have concrete specifications for the output format, you can find many examples of what the output format should look like in `server-news-list/examples` (you can also also find some relevant data from there). Each file in the examples directory covers one 'server-news-list' from a snapshot of history.

You can find more data in two files called ships.json and skins.json respectively, under `AzurLaneData/data/` (these are large though, I would recommend against loading both files entirely).

Do not output any comments, notes or anything other than the transformed news. For list items that look like historical navy battle equipment (e.g. "Quadruple 305mm (SK C39 Prototype)" or "Prototype Triple 283mm/54 Main Gun Mount") wrap those in double square brackets [[like this]]. Additionally regarding navy equipment strings specifically, omit anything in parentheses at the end, e.g. "(UR)" or "(SR)". Those substrings should NOT be included inside the square brackets. Also pay attention to the rarities of each ship, they can be found in `AzurLaneData/data/ships.json`.

Things to note:

- Ensure that all events that ended before today's date are not marked ongoing.
- "secrets" in the source file are called "memories" in our terminology, so when you look at the examples you should grep for memory or memories rather than secrets.
- Skins in the source are only ever specified under a new skins/rerun skins header, and won't appear anywhere else.
- Pay attention to the rarity of different ships, their rarity number affects which background is used for their shipdisplay.
- You can guess what banners exist based on the example banner names.
- Do not use browser automation tools for any reason. If you can't find something or can't assume something, make an educated guess and move on.
- Prioritize items from most recent -> oldest when deciding what to put in the server-news section. It's fine if older stuff is left out. Ensure most everything mentioned in the absolute latest patch notes file is included.
- **LIMIT 6 ITEMS TOTAL**.
- This should include at minimum:
  - 1 major event (either ongoing or just ended recently)
  - 1 major rerun event (either ongoing or just ended recently)
  - 1 new event / mechanic (either ongoing or just started)
- This should include at maximum:
  - 1 **specific character** skin-related event (either ended or just ended recently). If there is a general event aimed at skins (except Black Friday), it does not qualify under this and should not be included at all in this section.
- Project Identity events should NOT get their own section, they should only be mentioned within the description of the Patch Notes, similar to `example7.wikitext`.
- Sort all events from latest to earliest.

The task is fundamentally natural language to natural language, so unless you possess incredible knowledge in heuristics I'd recommend doing this by hand rather than writing a python script. Never guess any information. You are writing for a wiki, all the text you write must be directly supported by the sources given.

The data to transform is in the attached file, and the output path will be provided.

Ensure the output file is written to and NOT EMPTY before terminating.
