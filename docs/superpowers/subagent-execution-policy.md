# Subagent Execution Policy

This policy applies while executing the FortuneReading implementation plan
with Superpowers subagent-driven development.

## Core Rule

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
and record the reason in the Notion order/report log.

## Review Flow

For each implementation task:

1. Let the implementer finish.
2. Run local verification.
3. Dispatch a fresh specification reviewer.
4. Return valid findings to the same implementer.
5. Dispatch a fresh code-quality reviewer.
6. Move to the next task only after both reviews approve.

Do not run overlapping implementation agents against shared files.

## Notion Logging

Create one page per subagent in the `오더/보고 로그` database.

- Record the Korean task order when dispatching.
- Keep status as `진행` while the agent is running.
- Update the same page with the Korean result when it finishes.
- A tool timeout is not a failed result and must not be logged as one.
- Use database properties only for metadata such as title, category, status,
  order ID, agent names, execution time, and links.
- Use `구분` for the primary work type, not for order/report state. Choose one
  of `기획`, `구현`, `리뷰`, `보안`, `테스트`, `문서`, or `운영·설정`.
- When work overlaps multiple types, select the type that best represents the
  main objective. For example, a security vulnerability fix is `보안`, while a
  routine feature addition is `구현`.
- Write the full Korean order and result only in the page body with clear sections
  such as `작업 오더`, `수행 결과`, `검증`, and `참고 사항`.
- Record usage in the database `사용량` property, not in the page body.
- Record the exact token count only when the agent tool exposes it. Otherwise,
  label the value as an estimate and use a range rather than a precise number.
- Include the assigned model and measurement status in the property, for
  example: `GPT-5.4 mini · 약 5K-10K tokens · 추정값`.
- Base estimates on task scope, context size, tool activity, and review depth.
  Never present an estimated value as billing or API usage data.
