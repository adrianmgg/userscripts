
# about

[![view on github](https://img.shields.io/badge/view%20on%20github-272b33?logo=github)](https://github.com/adrianmgg/userscripts/tree/main/neal.fun/infinite_craft_combo_tracker) [![download on greasyfork](https://img.shields.io/badge/dynamic/json?color=%23900&label=download%20on%20greasyfork&query=total_installs&suffix=%20downloads&url=https%3A%2F%2Fgreasyfork.org%2Fen%2Fscripts%2F486552-infinite-craft-combo-tracker.json&logo=greasyfork)](https://greasyfork.org/en/scripts/486552-infinite-craft-combo-tracker)

various tweaks for [infinite craft](https://neal.fun/infinite-craft/)
- remembers all the combos you've created, with a UI for viewing them
- hold alt + click + drag to easily add a random element
- hold shift + click + drag to quickly spawn another of the most recently spawned element
- menu to view all your first discoveries
- middle click (or alt + left click) elements to favorite/pin them to the top
- custom search modes:
  - prefix with `regex:` for regex search (e.g. `regex:^[0-9]+$` would return any that consist of just numbers)
  - prefix with `regexi:` for case-insensitive regex search (e.g. `regexi:^wolf` would return `Wolf` and `Wolfman`, but not `Werewolf`)
  - prefix with `full:` to match the entire element name rather than just substrings (e.g. `full:12` would return `12`, but wouldn't return `1234` or `8126`)
  - prefix with `fulli:` for the same as `full:` except case insensitive (e.g. `fulli:wolf` would return `Wolf`, but wouldn't return `Werewolf`)

# compatibility

| browser | userscript manager | compatible? |
| ------- | ------------------ | ----------- |
| chrome  | tampermonkey       | yes         |
| firefox | tampermonkey       | yes         |
<!--
| chrome  | violentmonkey      | TODO test   |
| firefox | violentmonkey      | TODO test   |
| firefox | greasemonkey       | TODO test   |
-->

(other browsers or userscript managers will probably work, these are just the ones i've tested it on so far)

# notes
WARNING: the old version 3.1.0 contains a bug that will result in data being lost. if you're downgrading for some reason, don't install that one.

