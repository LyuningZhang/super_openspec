export function getReviewChangeSkillTemplate() {
  return {
    name: 'openspec-review-change',
    description: 'Review implementation against OpenSpec artifacts. Use when the user wants a review after applying tasks, before deciding whether to revise, continue, sync, or archive.',
    instructions: `Review an implementation against the OpenSpec change artifacts. This is a review gate, not an archive step.

**Input**: Optionally specify a change name. If omitted, infer it from conversation context only when unambiguous; otherwise run \`openspec list --json\` and ask the user to select.

**Review stance**

- Be skeptical and concrete. Findings lead the response.
- Review requirements before code style.
- Treat proposal/specs/design/tasks as the contract.
- Do not archive, sync, or mark tasks complete during review unless the user separately asks.
- At the end, report next options. Do not automatically start archive.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from context if one change is clearly active
   - If ambiguous, run \`openspec list --json\` and ask the user to choose

   Announce: "Reviewing change: <name>".

2. **Load workflow state**

   \`\`\`bash
   openspec status --change "<name>" --json
   openspec instructions apply --change "<name>" --json
   \`\`\`

   Read every file listed in \`contextFiles\`. Also inspect \`openspec/changes/<name>/specs/\` if present.

3. **Build the review contract**

   Extract:
   - Proposal intent and impact
   - Requirement names and scenarios from specs
   - Design decisions, risks, migrations, and file impact from design.md
   - Pending and completed tasks from tasks.md

   If the contract is incomplete or contradictory, report that first and recommend artifact fixes before code changes.

   Build a review matrix before judging code:
   \`\`\`markdown
   | Requirement / Scenario | Design Source | Task(s) | Implementation Evidence | Verification Evidence | Status |
   |------------------------|---------------|---------|-------------------------|-----------------------|--------|
   | <name>                 | <section>     | <task>  | <file/function/test>    | <command/check>       | implemented / partial / missing |
   \`\`\`

   Missing verification evidence is a review finding even when the code appears correct.

4. **Inspect implementation evidence**

   Use code search and file reads to map each requirement and task to implementation evidence. Review tests before implementation when tests exist.

4.5 **Choose review strategy**

   Pick the strategy based on change size and risk profile:

   **Quick inline review** (default for small changes):
   For changes <200 lines, single concern, low security impact:
   - Continue to step 5 and perform the five-axis review inline
   - This is the standard flow

   **Sub-agent review** (recommended for larger / higher-risk changes):
   For changes >200 lines, multi-file, security-sensitive, or user explicitly requests thorough review:
   - Dispatch up to 3 review sub-agents in PARALLEL (single message, multiple tool calls):

   1. **code-reviewer**: Full five-axis review (spec compliance, correctness, architecture, security/data safety, maintainability). Standard: "would a senior engineer approve this?"

   2. **security-auditor**: Deep security review. Focus on: input validation, secrets management, permissions enforcement, OWASP Top 10 vulnerabilities, destructive operations without safeguards, injection risks, sensitive data exposure

   3. **test-engineer** (optional, dispatch when test coverage is unclear): Test quality and coverage analysis. Check: do existing tests cover edge cases, are there missing test scenarios, are mocks hiding real behavior, is the Prove-It pattern satisfied for bug fixes

   **Sub-agent prompt template:**
   \`\`\`
   Review the implementation of OpenSpec change "<change-name>" against its artifacts.

   ## Review Contract
   <proposal intent, requirements from specs, design decisions, task list>

   ## Review Focus
   <specific axes to focus on, e.g., "security and data safety" for security-auditor>

   ## Expected Output
   For each finding:
   - Severity: Critical | Important | Suggestion
   - File and line reference
   - The violated requirement/design/task
   - Concrete fix direction

   End with: coverage summary, verification status, verdict (Request changes / Accept with warnings / Accept).
   \`\`\`

   After sub-agents complete, merge their reports. Present consolidated findings to the user, de-duplicating overlapping findings. Flag any conflicting assessments between reviewers for user resolution.

5. **Review in two passes across five axes**

   **Pass 1 - Spec compliance:**
   - Every requirement/scenario has implementation evidence
   - Every completed task has verification evidence
   - Implementation does not exceed non-goals or unapproved scope
   - Any implementation/artifact divergence is called out explicitly

   **Pass 2 - Code quality:**
   - Review the implementation quality only after spec compliance is understood

   - **Spec compliance**: requirements, scenarios, design decisions, task completion
   - **Correctness**: edge cases, error paths, state consistency, regressions
   - **Architecture**: fit with existing patterns, coupling, boundaries, dependencies
   - **Security / data safety**: validation, secrets, permissions, destructive operations
   - **Maintainability / performance**: unnecessary complexity, dead code, unbounded work, hot paths

6. **Classify findings**

   Use these severities:
   - **Critical**: blocks acceptance; broken requirement, data loss, security issue, or major regression
   - **Important**: should be fixed before considering the change complete
   - **Suggestion**: useful improvement, not blocking

   Each finding must include:
   - File and line reference when possible
   - The violated requirement/design/task, when applicable
   - A concrete fix direction

7. **Output**

   Start with findings, ordered by severity. If there are no findings, say that clearly.

   Then include:
   - **Coverage**: the review matrix summary, including implemented / partial / missing requirements and evidence gaps
   - **Verification**: commands/tests inspected or run, and anything not run
   - **Verdict**: "Request changes", "Accept with warnings", or "Accept"
   - **Next options**: revise artifacts, fix implementation, run more tests, sync specs, or archive later on explicit request

---

## Receiving Code Review

When review feedback arrives (from a sub-agent, a human reviewer, or CI), follow this protocol. Do NOT skim and jump to the first fix.

### Response Protocol

1. **READ completely**: Read ALL feedback before reacting to any single item. Do not skim for the first actionable thing and ignore the rest. Every finding deserves attention.

2. **UNDERSTAND each finding**: For each finding, restate it in your own words before acting. If anything is unclear, ask the reviewer before proceeding. "Just to confirm — you're saying X because of Y?"

3. **VERIFY independently**: Do not take the reviewer at their word. Check the actual code. Reproduce the issue if possible. A reviewer can be wrong or miss context. Evidence beats authority.

4. **EVALUATE systematically**: Classify every finding:
   - **MUST FIX**: broken requirement, security issue, data loss, regression — no debate
   - **SHOULD FIX**: valid concern, improves quality, right direction
   - **CONSIDER**: interesting idea, but not clearly better. Explain the trade-off, ask reviewer to decide
   - **DISAGREE**: reviewer is mistaken or missing context. Requires evidence, not opinion

5. **RESPOND with evidence**:
   - For MUST FIX / SHOULD FIX: describe the fix plan, don't performatively agree
   - For CONSIDER: explain the trade-off clearly, let reviewer decide
   - For DISAGREE: provide evidence (code references, test results, requirement citations), not personal preference

6. **IMPLEMENT**: Fix MUST FIX items first, then SHOULD FIX. Do NOT fix things that weren't flagged (scope discipline). After fixing, re-run verification. Update the response with what changed.

### Forbidden Behaviors

- **NO performative agreement**: Never say "You're absolutely right!" or "Great catch!" — just state what you'll fix and why
- **NO defensive explanations**: Don't explain why you wrote it that way unless the reviewer is factually wrong. Intent doesn't matter; the code as written does
- **NO scope creep**: Don't improve adjacent code the reviewer didn't flag. Stay focused on the findings
- **NO authority deference**: "The reviewer said so" is not a reason. Evidence-based disagreement is valid when you believe the reviewer is wrong

### When to Push Back

Push back with evidence when:
- The reviewer missed a requirement or constraint that justifies the current implementation
- The suggested change would break existing tests or behavior
- The reviewer's concern is already handled elsewhere (cite the exact location)
- The suggested change would introduce complexity without proportional benefit
- The finding is based on a misunderstanding of the code structure

For every disagreement, provide: a specific file path or test that supports your position. Never disagree based on "I think" or "I prefer."

**Guardrails**

- Do not auto-archive after review.
- Do not say "ready for archive" as the primary outcome. Prefer "review accepted" or "review passed".
- If archive is appropriate, phrase it as an optional next action requiring explicit user instruction.
- If implementation differs from artifacts but is better, recommend updating artifacts before acceptance.
- If tasks are checked off but no evidence exists, flag it as Important or Critical depending on requirement impact.
- For changes >200 lines or security-sensitive, dispatch sub-agent reviewers (code-reviewer + security-auditor) in parallel.
- When receiving review feedback: read completely, verify independently, classify every finding, never performatively agree.`,
    license: 'MIT',
    compatibility: 'Requires openspec CLI.',
    metadata: { author: 'openspec', version: '1.0' },
  };
}

export function getOpsxReviewCommandTemplate() {
  return {
    name: 'OPSX: Review',
    description: 'Review implementation against OpenSpec artifacts without archiving',
    category: 'Workflow',
    tags: ['workflow', 'review', 'quality'],
    content: `Review an implementation against the OpenSpec change artifacts. This is a review gate, not an archive step.

**Input**: Optionally specify a change name after \`/opsx:review\` (e.g., \`/opsx:review add-auth\`). If omitted, infer it from conversation context only when unambiguous; otherwise run \`openspec list --json\` and ask the user to select.

Follow the same process as the \`openspec-review-change\` skill:

1. Select the change and announce it.
2. Run \`openspec status --change "<name>" --json\` and \`openspec instructions apply --change "<name>" --json\`.
3. Read all context files and delta specs.
4. Extract the review contract from proposal, specs, design, and tasks.
5. Build a review matrix mapping requirement/scenario -> design source -> task -> implementation evidence -> verification evidence -> status.
6. Choose review strategy: quick inline review for small changes (<200 lines), or dispatch up to 3 sub-agent reviewers in parallel (code-reviewer + security-auditor + optionally test-engineer) for larger or security-sensitive changes.
7. Review in two passes: spec compliance first, then code quality across correctness, architecture, security/data safety, maintainability, and performance.
8. Lead with Critical/Important/Suggestion findings, then coverage matrix summary, verification, verdict, and next options.

Do not archive, sync, or mark tasks complete during review unless the user separately asks. End with optional next actions, not automatic archive.

When receiving review feedback from sub-agents, humans, or CI: read ALL feedback first, understand each finding, verify independently (evidence > authority), classify as MUST FIX / SHOULD FIX / CONSIDER / DISAGREE, respond with evidence not opinions, and never use performative agreement like "You're absolutely right!"`,
  };
}
