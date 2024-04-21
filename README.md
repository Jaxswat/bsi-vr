# BioShock: Infinite for SteamVR Home

I like BioShock: Infinite so I wanted to make an experience around it in SteamVR Home.
This repository contains the code and other custom tools I wrote to make it.

#### [Subscribe on Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=2952477736)

[<img src="https://img.youtube.com/vi/-QKq8XJSEFk/maxresdefault.jpg" width=500px>](https://youtu.be/-QKq8XJSEFk)

## Assets

For an overview on how I made the map and extracted assets, read my [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2953264938).

Note: `asset_tools/animations/bsi_anim.exe` is a C# program written by a mysterious character named [ID-Dameon](https://www.gildor.org/smf/index.php?topic=2478.0).
It extracts animations from the game's morpheme animation files.
The original Zenhax thread seems to be gone, but I've preserved the tool in this repo.
I have verified that the source code is harmless via ILSpy, it's just a quickly hacked together binary format decoder.

## Code

SteamVR allows you to write scripts in Lua. I don't like Lua.
It's fine for small scripts, but I wanted to create advanced game-engine like systems, and Lua was not going to scale for me.
TypeScript is a great solution to this because it has types while still maintaining a script-like runtime, so for this I use [TypeScriptToLua](https://github.com/TypeScriptToLua/TypeScriptToLua).

Thankfully the DotA2 modding community has already done a lot of the effort of writing type declaration files.
Most of them have been heavily modified to fit my style and the differences in the SteamVR Scripting API.

This paired with some postprocessing scripts has made for an incredibly powerful scripting environment.
Writing complex AI logic for Elizabeth's behavior has been incredibly easy in comparison to when I was prototyping in plain Lua.
While the SteamVR Scripting API isn't thoroughly documented, I've been able to solve most of my needs through trial and error.

All of the scripts at the moment use [`bun`](https://github.com/oven-sh/bun).

### VScript

These are the game scripts that run in the SteamVR environment.

Directory: `vscript`

Scripts:
- `bun run clean` - deletes `build/`
- `bun run build` - builds the code into `build/`
- `bun run copy` - copies `build/` into the SteamVR environment's `vscripts` directory
- `bun run build-and-copy` does all of the above steps

### VSND Generator

SteamVR Home requires all sound files to be defined in `soundevents_addon.vsndevts`.
I also require these clips to be cataloged for Elizabeth's AI code.

This script does code generation for the .vsndevts file as well as my TypeScript code.
Sounds are configured in the code of this file, and then I paste in the generated code into the respective files.

Directory: `vsnd_generator`

Scripts:
- `bun run generate` - Creates code snippets for `.vsndevts` and TypeScript speech config.

### VoiceDB

Elizabeth has about 1600 lines of dialogue.
To help catalog these, I transcribed them with [OpenAI's Whisper](https://github.com/openai/whisper), and then made a simple Express server to tag them by sentiment and intensity.

I also transcribed the other characters' lines, but I haven't tagged them yet.
Whisper isn't completely accurate, but these files are good for simple CTRL+F searching.

The JSON files are stored in `data/`.

Directory: `voicedb`

The scripts have some hardcoded configuration, but they work:
- `bun run transcribe` - runs `whisper` command on all audio files
- `bun run dupecheck` - Verifies that there are no duplicate files. (I don't think the game would pack duplicated but I was suspicous at some point)
- `bun run tag` - runs express server on `localhost:3000` for a simple tagging interface

### bsi_anim (Morpheme Animation to Source SMD)

This tool converts Morpheme animations (`MorphemeAnimSet` and .`MorphemeAnimSequence`) to Source SMD files (`smd`).
It only supports a few specific types of animations, but it works for the animations I cared to extract.

The original executable was written in C# and published on August 29th, 2016 by [id-dameon on the Zenhax forums](https://web.archive.org/web/20230429095935/https://zenhax.com/viewtopic.php?f=5&t=3009).
The Zenhax forum is no longer online, but [id-dameon is still an active member on ResHax](https://reshax.com/profile/8-id-daemon).
Without any documentation or source code, he reverse engineered the animation data from the Morpheme files to create the tool.

In an effort to improve and preserve the tool, I have decompiled it and rewritten it in rust.
The code is chaotic as it originates from decompiled/obfuscated C#, but it works.
I have added a better CLI interface, as well as some logic that makes it work with Blender's SMD importer.

Directory: `bsi_anim`

Usage: `bsi_anim.exe ./path/to/your/animation.MorphemeAnimSequence`

Optional flag: `-l` / `--legacy` - Uses the original program output

Point it to a `.MorphemeAnimSequence` file and it will output a `.smd` file in that same directory.
It does require the `MorphemeAnimSet` file to be in the parent directory, but it will find it automatically.
If you've used the UModel exporter, they should already be unpacked in this folder structure.

### VConsole Tunnel (VTunnel)

VTunnel is a rust program that listens to the VConsole output of SteamVR Home (which runs on `localhost:29009`).
It is able to read some of the VConsole protocol, most importantly the print statements.

Print statements can be sent from the Lua scripts.
I wanted to be able to extract game data in an external program, so to do this I wrote a very basic text-based protocol for sending string/number/vector data.
I intend on using this for debugging, and perhaps some other tools.

I would like to try using it to help me draw a navigation mesh with my VR controllers.
I would have done this in the game scripts, but I needed to persist the data.

# Questions / Suggestions

Scripting in Source 2 can be very hard due to the sparse documentation. If you have any questions, ideas, or suggestions let me know.
Either open an issue on this repo, or ping me on Discord `@jaxswat`.
