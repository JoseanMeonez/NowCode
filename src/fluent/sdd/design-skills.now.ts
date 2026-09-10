import { ScriptInclude } from '@servicenow/sdk/core'

ScriptInclude({
    $id: Now.ID['f4be9fedfeac4d24a6796aca51335fb8'],
    name: 'NowCodeDesignSkills',
    script: Now.include('./design-skills.server.js'),
    description:
        'Provides frontend design skills and UI/UX intelligence as structured knowledge. Includes the Anthropic Frontend Design skill (grounding, hero design, typography, visual structure, motion, process, anti-patterns, restraint, writing) and the UI UX Pro Max skill (reasoning rules, UI styles, color palettes, typography pairings, UX guidelines, design system generation, pre-delivery checklist, resilient text). Returns skills by name or context, with an LLM-ready formatted output for system prompt injection.',
    apiName: 'x_1733631_now_code.NowCodeDesignSkills',
    clientCallable: false,
    mobileCallable: false,
    sandboxCallable: false,
    active: true,
})
