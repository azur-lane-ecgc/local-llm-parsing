---
folder: server-news-list
---

I want to transform some news to a given format. The news is for a mobile game about warships called Azur Lane. The given format is written in MediaWiki wiki markup. While I do not have concrete specifications for the output format, you can find many examples of what the output format should look like in `server-news-list/examples` (you can also also find some relevant data from there). Each file in the examples directory covers one 'server-news-list' from a snapshot of history.

You can find more data in two files called ships.json and skins.json respectively, under `AzurLaneData/data/` (these are large though, I would recommend against loading both files entirely). One thing to note is that the order of the bullet points should be similar to previous patch notes, e.g. the "mainline event" should come first and the list of ship portraits ("shipdisplays") should be early.

Do not output any comments, notes or anything other than the transformed news. For list items that look like historical navy battle equipment (e.g. "Quadruple 305mm (SK C39 Prototype)" or "Prototype Triple 283mm/54 Main Gun Mount") wrap those in double square brackets [[like this]]. Additionally regarding navy equipment strings specifically, omit anything in parentheses at the end, e.g. "(UR)" or "(SR)". Those substrings should NOT be included inside the square brackets. The gem prices of skins aren't specified in the attached file (in addition to several other details), but you can find that information in `AzurLaneData/data/skins.json` by grepping for their names and looking at the surrounding lines. Also pay attention to the rarities of each ship, they can be found in `AzurLaneData/data/ships.json`.

Things to note:
Ensure that all events that ended before today's date are not marked ongoing.
"secrets" in the source file are called "memories" in our terminology, so when you look at the examples you should grep for memory or memories rather than secrets.
Skins in the source are only ever specified under a new skins/rerun skins header, and won't appear anywhere else.
Rental skins shouldn't be priced with their gem prices, their price should be one rental ticket.
Pay attention to the rarity of different ships, their rarity number affects which background is used for their shipdisplay.
For rerun events, the initial run of the event is guaranteed to be described in one of the three example files. In this case you can simply use the information from there instead, as rerun events change very little from their original runs. The same thing applies for events that have become permanent (i.e. "added to war archives").

The task is fundamentally natural language to natural language, so unless you possess incredible knowledge in heuristics I'd recommend doing this by hand rather than writing a python script. Never guess any information. You are writing for a wiki, all the text you write must be directly supported by the sources given.

The data to transform is in the attached file, and the output path will be provided.

You can guess what banners exist based on the example banner names.

Do not use browser automation tools for any reason. If you can't find something or can't assume something, make an educated guess and move on.
