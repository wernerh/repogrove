---
repos: [gitui, lazygit]
---

<!-- Title below is for readability of this raw file only — the page renders
     its own "<Repo A> vs <Repo B>" <h1> from the repos above, same
     unrendered-leading-title convention content/repos/*.md and
     content/alternatives/*.md use (see src/lib/content.ts's
     stripLeadingTitle doc comment for the repos/groves case). Only
     "## How they differ" below is actually parsed. -->
# GitUI vs LazyGit

## How they differ
Both are terminal UIs that wrap git with keyboard-driven staging, but they're written
in different languages and lean on that difference for different strengths. LazyGit is
written in Go (confirmed via its own Go module listing) and couples staging with the
rest of git's day-to-day workflow — interactive rebase, conflict resolution, hunk-level
staging — in a single layout built around that broader day-to-day feature set.

GitUI is written in Rust on top of `git2` and was built specifically with large-
repository performance in mind: staging is just as central, but the project leans on
Rust's speed and memory profile to stay responsive on repositories with very long
histories, a case where some other terminal git tools start to lag.

In short: reach for LazyGit for the broader day-to-day feature set — rebasing,
conflict resolution, and hunk-level staging all in one layout; reach for GitUI if raw
speed and memory efficiency on a very large repository, or a Rust-based toolchain,
matters more to you.
