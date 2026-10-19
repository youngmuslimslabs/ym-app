# Shared YM developer skills (#87)

The canonical skills live in `.claude/skills/`. `.agents/skills/` links to the
same directories for tools that discover project skills there. Nothing is copied
to a developer's personal global configuration. Clients must support symlinks for
automatic discovery through both paths; otherwise invoke the canonical path.

| Skill | Use |
| --- | --- |
| `ym-code-review` | Review actual PR changes, authorization boundaries and regression coverage. |
| `ym-testing` | Plan/write behavior tests, including failed saves and direct database enforcement. |
| `ym-ui-testing` | Verify member/admin browser journeys and responsive states. |
| `ym-release-verification` | Check stacked PRs, CI, migrations and hosted acceptance. |
| `ym-db-changes` | Existing database guidance, corrected to protect the live shared project and prefer incremental migrations. |

For example, ask “Use ym-code-review to review PR #123” or “Use ym-testing to
add a regression for this failed profile save.” These skills add repository
context; they do not grant production, messaging or deployment permissions.

The new skill frontmatter and naming were validated with the skill-creator
validator. Their commands and file references were checked against this repository.
Realistic operating behavior still depends on the available browser/database
environment; no developer workflow was run against production as validation.
