# Graph Report - .  (2026-06-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 121 nodes · 142 edges · 9 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2c9b7eeb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 23 edges
2. `scripts` - 11 edges
3. `formatter` - 6 edges
4. `formatBytes()` - 6 edges
5. `formatDuration()` - 6 edges
6. `tokwatchr-cli` - 6 edges
7. `executeDownload()` - 5 edges
8. `executeWatch()` - 5 edges
9. `rules` - 4 edges
10. `formatter` - 4 edges

## Surprising Connections (you probably didn't know these)
- `executeDownload()` --calls--> `formatBytes()`  [EXTRACTED]
  src/commands/download.ts → src/utils/format.ts
- `executeDownload()` --calls--> `formatDuration()`  [EXTRACTED]
  src/commands/download.ts → src/utils/format.ts
- `executeWatch()` --calls--> `formatBytes()`  [EXTRACTED]
  src/commands/watch.ts → src/utils/format.ts
- `executeWatch()` --calls--> `formatDuration()`  [EXTRACTED]
  src/commands/watch.ts → src/utils/format.ts

## Communities (9 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (25): compilerOptions, allowImportingTsExtensions, declaration, declarationMap, erasableSyntaxOnly, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules (+17 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (18): files, ignoreUnknown, includes, maxSize, formatter, enabled, formatWithErrors, indentStyle (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (17): bin, tokwatchr, dependencies, kowu-cli, tokwatchr, description, devDependencies, @biomejs/biome (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.28
Nodes (10): executeDownload(), executeWatch(), registerSigintHandler(), cli, DownloadCliOptions, SharedCliOptions, WatchCliOptions, formatBytes() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (11): Branch Naming, code:block1 (/git-graphify --update), Commit Messages, Conventions, Git Safety Rules, Graph structure, Knowledge Graph, Quality Gates (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (11): scripts, build, check, check:write, format, format:write, lint, lint:write (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (4): CliError, ConfigError, handleFatalError(), UserCancelledError

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (8): noForEach, linter, enabled, rules, complexity, recommended, style, noNonNullAssertion

## Knowledge Gaps
- **73 isolated node(s):** `name`, `version`, `description`, `type`, `tokwatchr` (+68 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `Community 5` to `Community 2`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `linter` connect `Community 7` to `Community 1`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _73 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._