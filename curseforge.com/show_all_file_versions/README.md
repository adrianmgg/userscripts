
# about

[![view on github](https://img.shields.io/badge/view%20on%20github-272b33?logo=github)](https://github.com/adrianmgg/userscripts/tree/main/curseforge.com/show_all_file_versions) [![download on greasyfork](https://img.shields.io/badge/dynamic/json?color=%23900&label=download%20on%20greasyfork&query=total_installs&suffix=%20downloads&url=https%3A%2F%2Fgreasyfork.org%2Fen%2Fscripts%2F449331-curseforge-show-all-file-versions.json&logo=data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+R3JlYXN5IEZvcms8L3RpdGxlPjxwYXRoIGQ9Ik01Ljg5IDIuMjI3YS4yOC4yOCAwIDAgMSAuMjY2LjA3Nmw1LjA2MyA1LjA2MmMuNTQuNTQuNTA5IDEuNjUyLS4wMzEgMi4xOTJsOC43NzEgOC43N2MxLjM1NiAxLjM1NS0uMzYgMy4wOTctMS43MyAxLjcyOGwtOC43NzItOC43N2MtLjU0LjU0LTEuNjUxLjU3MS0yLjE5MS4wMzFsLTUuMDYzLTUuMDZjLS4zMDQtLjMwNC4zMDQtLjkxMS42MDgtLjYwOGwzLjcxNCAzLjcxM0w3LjU5IDguMjk3IDMuODc1IDQuNTgyYy0uMzA0LS4zMDQuMzA0LS45MTEuNjA3LS42MDdsMy43MTUgMy43MTQgMS4wNjctMS4wNjZMNS41NDkgMi45MWMtLjIyOC0uMjI4LjA1Ny0uNjI2LjM0Mi0uNjgzWk0xMiAwQzUuMzc0IDAgMCA1LjM3NSAwIDEyczUuMzc0IDEyIDEyIDEyYzYuNjI1IDAgMTItNS4zNzUgMTItMTJTMTguNjI1IDAgMTIgMFoiLz48L3N2Zz4=)](https://greasyfork.org/en/scripts/449331-curseforge-show-all-file-versions)

shows all the versions listed for a file, rather than hiding them behind a +2 thing you need to hover over

currently only works on `legacy.curseforge.com`, support for the new curseforge pages is being worked on.

# example

changes this:

| Uploaded | Game Version | Downloads |
| -------- | ------------ | --------- |
| 2 hours ago | 1.19.2 (+2) | 492 |
| 2 hours ago | 1.19.2 (+2) | 112 |

to this:

| Uploaded | Game Version | Downloads |
| -------- | ------------ | --------- |
| 2 hours ago | 1.19.2<br/>Java 17<br/>Forge | 492 |
| 2 hours ago | 1.19.2<br/>Java 17<br/>Fabric | 112 |

# compatibility

| browser | userscript manager | compatible? |
| ------- | ------------------ | ----------- |
| chrome  | tampermonkey       | yes         |
| chrome  | violentmonkey      | yes         |
| firefox | tampermonkey       | yes         |
| firefox | violentmonkey      | yes         |
| firefox | greasemonkey       | yes         |

(other browsers or userscript managers will probably work, these are just the ones i've tested it on)

