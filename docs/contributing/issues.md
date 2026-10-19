# Writing YM issues

Choose **Bug report** for broken behavior, **Feature request** for a new capability,
**Parent initiative** for an outcome spanning several issues, or **Implementation
task / sub-issue** for one bounded delivery. Forms appear in GitHub's issue chooser
after `.github/ISSUE_TEMPLATE` is merged to the default branch. Blank issues remain
available for cases the forms do not cover.

Describe the affected user, current/desired behavior and observable acceptance
criteria. Verification should check the behavior, including relevant permissions
and failure paths. For an operational task, state the actual output and acceptance
step instead of inventing a UI story. Keep member details and secrets out of this
public repository; use anonymized examples and redacted evidence.

Create sub-issues through the parent's **Add sub-issue** control, or attach an
existing issue there. A Parent issue field, checklist or `#number` reference alone
does not create GitHub's native hierarchy. Record blockers as explicit links and
add native dependency relationships where the repository supports them. Triage
sets the owner, milestone, project status and priority; these forms do not infer
those values or automatically add an item to the private project board.

Link implementation PRs to the relevant issue. Use a closing keyword only when
merging the PR will satisfy the whole issue. Keep issues with pending hosted setup,
data collection or acceptance open, and state the remaining work in the PR.

Source: [GitHub issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms).
