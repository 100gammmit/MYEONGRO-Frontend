# Subagent Execution Policy

This policy applies only when `AGENTS.md` permits subagent use. The repository
policy in `AGENTS.md` takes precedence over this document and older
implementation plans.

## Core Rule

A subagent may be used only when there are at least three independent tasks.
Small features and sequential work are implemented directly by the main agent.

A `wait_agent` timeout means only that the agent has not completed yet. It is
not evidence of a deadlock. Do not interrupt, close, or replace an agent solely
because a wait timed out or because files have not changed yet.

## Model Assignment

- Use `gpt-5.4-mini` for narrow exploration, mechanical checks, and focused
  reviews.
- Use `gpt-5.4` for multi-file implementation, authentication, security, and
  database work.
- Reserve `gpt-5.5` for the final integration review.
- Start agents with `fork_context: false` and provide only the task context
  they need.

## Dispatch Requirements

Before dispatching an implementation agent:

1. Give it one bounded task with explicit owned files.
2. State acceptance criteria and verification commands.
3. Tell it not to revert other contributors' changes.
4. Require a final status of `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, or
   `BLOCKED`.
5. Avoid interrupting the agent merely to request a progress report.

## Waiting Policy

- Allow at least 15 minutes for a normal implementation task before considering
  a health check.
- Allow at least 8 minutes for a read-only review.
- Use one long `wait_agent` call instead of repeated short polling.
- While an agent runs, perform only non-overlapping coordination or
  verification work.
- Do not infer inactivity from unchanged files. Agents may be reading,
  designing, or running tests before editing.

## Health Checks

A health check is justified only when at least one of these is true:

- The minimum waiting period has elapsed with no completion.
- The agent explicitly reported `NEEDS_CONTEXT` or `BLOCKED`.
- A required external dependency has failed.
- The user asks for an immediate status check.

Send a non-interrupting `send_input` for a health check. Ask for a concise
status and let the current task continue. Do not use `interrupt: true` unless
the user changes or cancels the task, or the agent is demonstrably executing
the wrong/destructive operation.

## Deadlock Criteria

Treat an agent as genuinely stuck only when:

1. The minimum waiting period has elapsed.
2. A non-interrupting health check receives no response after an additional
   5 minutes, or the agent explicitly reports `BLOCKED`.
3. There is no active command or external operation that reasonably explains
   the delay.

Only then may the task be resized or reassigned. Preserve any existing edits
and retain the reason for the milestone-level Notion report.

## Review Flow

- Do not assign a dedicated specification reviewer and code-quality reviewer
  to every implementation agent.
- The main agent reviews integrated changes according to risk and scope.
- Use a separate review agent only when the user requests it or when a
  milestone-level review is independently useful.
- Do not run overlapping implementation agents against shared files.

## Verification Flow

- Run focused tests after each implementation step.
- Run the full test suite and other repository-wide checks once at the end of
  the milestone.
- Broaden verification earlier only for high-risk changes or when explicitly
  requested.

## Notion Logging

- Do not create one page per task or subagent.
- Create one Notion page when a milestone is complete.
- Summarize the milestone goal, major changes, verification, unresolved items,
  and next milestone on that page.
- A tool timeout is not a failed result and must not be reported as one.
