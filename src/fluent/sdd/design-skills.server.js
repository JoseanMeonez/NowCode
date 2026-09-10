var NowCodeDesignSkills = Class.create()
NowCodeDesignSkills.prototype = {
    initialize: function () {
        this._frontendDesignSkill = this._buildFrontendDesignSkill()
        this._uiUxProMaxSkill = this._buildUiUxProMaxSkill()
    },

    // ──────────────────────────────────────────────
    //  PUBLIC METHODS
    // ──────────────────────────────────────────────

    /**
     * Returns the full Anthropic Frontend Design skill as a structured object.
     * Sections: grounding, hero_design, typography, visual_structure, motion,
     * process, anti_patterns, restraint, writing
     * @returns {object} The frontend design skill
     */
    getFrontendDesignSkill: function () {
        return this._frontendDesignSkill
    },

    /**
     * Returns the UI UX Pro Max skill as a structured object.
     * Sections: reasoning_rules, ui_styles, color_palettes, typography_pairings,
     * ux_guidelines, design_system_generation, pre_delivery_checklist, resilient_text
     * @returns {object} The UI UX Pro Max skill
     */
    getUiUxProMaxSkill: function () {
        return this._uiUxProMaxSkill
    },

    /**
     * Returns both design skills combined.
     * @returns {object} Both skills keyed by name
     */
    getAllDesignSkills: function () {
        return {
            frontend_design: this._frontendDesignSkill,
            ui_ux_pro_max: this._uiUxProMaxSkill,
        }
    },

    /**
     * Formats all design skills into a concise markdown text block
     * suitable for LLM system prompt injection.
     * @returns {string} Formatted markdown text block
     */
    formatForLLM: function () {
        var lines = []
        lines.push('=== DESIGN SKILLS & UI/UX INTELLIGENCE ===')
        lines.push('')

        // --- Anthropic Frontend Design ---
        lines.push('## Anthropic Frontend Design Principles')
        lines.push('')
        var fd = this._frontendDesignSkill

        var sectionKeys = Object.keys(fd.sections)
        for (var i = 0; i < sectionKeys.length; i++) {
            var sKey = sectionKeys[i]
            var section = fd.sections[sKey]
            lines.push('### ' + section.title)
            for (var j = 0; j < section.principles.length; j++) {
                var p = section.principles[j]
                lines.push('- **' + p.title + '**: ' + p.detail)
            }
            lines.push('')
        }

        // --- UI UX Pro Max ---
        lines.push('## UI UX Pro Max Intelligence')
        lines.push('')
        var ux = this._uiUxProMaxSkill

        var uxKeys = Object.keys(ux.sections)
        for (var k = 0; k < uxKeys.length; k++) {
            var uKey = uxKeys[k]
            var uSection = ux.sections[uKey]
            lines.push('### ' + uSection.title)

            if (uSection.items && uSection.items.length > 0) {
                for (var m = 0; m < uSection.items.length; m++) {
                    var item = uSection.items[m]
                    if (item.detail) {
                        lines.push('- **' + item.title + '**: ' + item.detail)
                    } else {
                        lines.push('- ' + item.title)
                    }
                }
            }
            if (uSection.summary) {
                lines.push(uSection.summary)
            }
            lines.push('')
        }

        return lines.join('\n')
    },

    /**
     * Given a context object, returns filtered/relevant design guidance.
     * @param {object} context - { type, industry, style_preference }
     *   type: e.g. 'ui_page', 'service_portal', 'workspace', 'form'
     *   industry: e.g. 'healthcare', 'finance', 'ecommerce', 'tech_saas'
     *   style_preference: e.g. 'minimalism', 'glassmorphism', 'dark_mode'
     * @returns {object} Filtered guidance with rationale
     */
    getDesignSkillsForContext: function (context) {
        var guidance = []
        var contextType = (context && context.type) || ''
        var contextIndustry = (context && context.industry) || ''
        var contextStyle = (context && context.style_preference) || ''

        var fd = this._frontendDesignSkill
        var ux = this._uiUxProMaxSkill

        // --------------------------------------------------
        // Always include core frontend design principles
        // --------------------------------------------------
        var coreSections = ['grounding', 'restraint', 'writing']
        for (var c = 0; c < coreSections.length; c++) {
            var sec = fd.sections[coreSections[c]]
            if (sec) {
                guidance.push({
                    source: 'frontend_design',
                    section: coreSections[c],
                    title: sec.title,
                    principles: sec.principles,
                    reason: 'Core design principle applies to all UI work',
                })
            }
        }

        // --------------------------------------------------
        // Type-specific frontend design guidance
        // --------------------------------------------------
        if (contextType === 'ui_page' || contextType === 'service_portal' || contextType === 'workspace') {
            var uiSections = ['hero_design', 'typography', 'visual_structure', 'motion', 'anti_patterns']
            for (var u = 0; u < uiSections.length; u++) {
                var uSec = fd.sections[uiSections[u]]
                if (uSec) {
                    guidance.push({
                        source: 'frontend_design',
                        section: uiSections[u],
                        title: uSec.title,
                        principles: uSec.principles,
                        reason: 'Directly applicable to ' + contextType + ' design',
                    })
                }
            }

            // Process section for full builds
            var procSec = fd.sections.process
            if (procSec) {
                guidance.push({
                    source: 'frontend_design',
                    section: 'process',
                    title: procSec.title,
                    principles: procSec.principles,
                    reason: 'Design process guidance for building ' + contextType,
                })
            }
        }

        if (contextType === 'form') {
            var formSections = ['typography', 'visual_structure', 'writing', 'restraint']
            for (var f = 0; f < formSections.length; f++) {
                var fSec = fd.sections[formSections[f]]
                if (fSec) {
                    guidance.push({
                        source: 'frontend_design',
                        section: formSections[f],
                        title: fSec.title,
                        principles: fSec.principles,
                        reason: 'Applicable to form layout and field design',
                    })
                }
            }
        }

        // --------------------------------------------------
        // Always include pre-delivery checklist & resilient text
        // --------------------------------------------------
        var alwaysUx = ['pre_delivery_checklist', 'resilient_text']
        for (var a = 0; a < alwaysUx.length; a++) {
            var aSec = ux.sections[alwaysUx[a]]
            if (aSec) {
                guidance.push({
                    source: 'ui_ux_pro_max',
                    section: alwaysUx[a],
                    title: aSec.title,
                    items: aSec.items,
                    reason: 'Quality checklist applies to all UI deliverables',
                })
            }
        }

        // --------------------------------------------------
        // UX guidelines always relevant
        // --------------------------------------------------
        var uxGuidelines = ux.sections.ux_guidelines
        if (uxGuidelines) {
            guidance.push({
                source: 'ui_ux_pro_max',
                section: 'ux_guidelines',
                title: uxGuidelines.title,
                items: uxGuidelines.items,
                reason: 'UX best practices and accessibility standards',
            })
        }

        // --------------------------------------------------
        // Industry-specific reasoning rules
        // --------------------------------------------------
        if (contextIndustry) {
            var rules = ux.sections.reasoning_rules
            if (rules && rules.items) {
                var industryRules = []
                for (var r = 0; r < rules.items.length; r++) {
                    var rule = rules.items[r]
                    if (rule.industry && rule.industry.toLowerCase() === contextIndustry.toLowerCase()) {
                        industryRules.push(rule)
                    }
                }
                if (industryRules.length > 0) {
                    guidance.push({
                        source: 'ui_ux_pro_max',
                        section: 'reasoning_rules',
                        title: 'Industry-Specific Rules: ' + contextIndustry,
                        items: industryRules,
                        reason: 'Tailored reasoning rules for ' + contextIndustry + ' industry',
                    })
                }
            }
        }

        // --------------------------------------------------
        // Style-specific guidance
        // --------------------------------------------------
        if (contextStyle) {
            var styles = ux.sections.ui_styles
            if (styles && styles.items) {
                var matchedStyles = []
                for (var st = 0; st < styles.items.length; st++) {
                    var style = styles.items[st]
                    if (style.title && style.title.toLowerCase().indexOf(contextStyle.toLowerCase()) !== -1) {
                        matchedStyles.push(style)
                    }
                }
                if (matchedStyles.length > 0) {
                    guidance.push({
                        source: 'ui_ux_pro_max',
                        section: 'ui_styles',
                        title: 'Style Guidance: ' + contextStyle,
                        items: matchedStyles,
                        reason: 'Matches requested style preference: ' + contextStyle,
                    })
                }
            }

            // Include color palettes for the style
            var palettes = ux.sections.color_palettes
            if (palettes && palettes.items) {
                var matchedPalettes = []
                for (var cp = 0; cp < palettes.items.length; cp++) {
                    var palette = palettes.items[cp]
                    if (palette.style && palette.style.toLowerCase().indexOf(contextStyle.toLowerCase()) !== -1) {
                        matchedPalettes.push(palette)
                    }
                }
                if (matchedPalettes.length > 0) {
                    guidance.push({
                        source: 'ui_ux_pro_max',
                        section: 'color_palettes',
                        title: 'Color Palettes for: ' + contextStyle,
                        items: matchedPalettes,
                        reason: 'Color palettes aligned with style: ' + contextStyle,
                    })
                }
            }
        }

        // --------------------------------------------------
        // Design system generation for full UI builds
        // --------------------------------------------------
        if (contextType === 'ui_page' || contextType === 'service_portal' || contextType === 'workspace') {
            var dsg = ux.sections.design_system_generation
            if (dsg) {
                guidance.push({
                    source: 'ui_ux_pro_max',
                    section: 'design_system_generation',
                    title: dsg.title,
                    items: dsg.items,
                    summary: dsg.summary,
                    reason: 'Design system generation process for building ' + contextType,
                })
            }
        }

        // --------------------------------------------------
        // Typography pairings
        // --------------------------------------------------
        if (
            contextType === 'ui_page' ||
            contextType === 'service_portal' ||
            contextType === 'workspace'
        ) {
            var typo = ux.sections.typography_pairings
            if (typo) {
                guidance.push({
                    source: 'ui_ux_pro_max',
                    section: 'typography_pairings',
                    title: typo.title,
                    items: typo.items,
                    reason: 'Font pairing recommendations for ' + contextType,
                })
            }
        }

        return {
            context: context,
            total_guidance_sections: guidance.length,
            guidance: guidance,
        }
    },

    // ──────────────────────────────────────────────
    //  PRIVATE BUILDERS
    // ──────────────────────────────────────────────

    _buildFrontendDesignSkill: function () {
        return {
            name: 'Anthropic Frontend Design',
            description: 'Principles for crafting distinctive, purposeful frontend designs that avoid template-driven sameness.',
            sections: {
                grounding: {
                    title: 'Grounding',
                    principles: [
                        {
                            title: 'Ground designs in subject matter',
                            detail: 'Identify the audience, industry, and primary job the design serves. Every visual decision should trace back to the subject domain, not a generic template.',
                        },
                        {
                            title: 'Identify the audience first',
                            detail: 'Who uses this? What is their skill level, context, and emotional state when they arrive? Design for that person, not for a portfolio.',
                        },
                        {
                            title: 'Industry awareness',
                            detail: 'Each industry has visual norms and user expectations. A healthcare dashboard reads differently from a fintech trading screen. Respect the domain language.',
                        },
                        {
                            title: 'Define the primary job',
                            detail: 'What single task must succeed? The hero, the layout weight, and the interaction flow should all serve that job.',
                        },
                    ],
                },
                hero_design: {
                    title: 'Hero Design',
                    principles: [
                        {
                            title: 'The hero is the first thing viewers see',
                            detail: 'Open with the most characteristic element of the subject. If it is a data product, show the data. If it is a tool, show the tool in action.',
                        },
                        {
                            title: 'Lead with the distinctive element',
                            detail: 'Avoid generic stock imagery or abstract illustrations. Show the actual product, interface, or outcome the user cares about.',
                        },
                        {
                            title: 'Make the hero earn its space',
                            detail: 'Every pixel of hero real estate should communicate value. If the hero could belong to any product, it is not working hard enough.',
                        },
                    ],
                },
                typography: {
                    title: 'Typography',
                    principles: [
                        {
                            title: 'Typography carries personality',
                            detail: 'Choose typefaces deliberately. The font communicates brand identity before a single word is read. Geometric sans says modern-tech; humanist sans says approachable; serif says established-authority.',
                        },
                        {
                            title: 'Set a clear type scale',
                            detail: 'Define a ratio-based scale (e.g. 1.25 major third) and stick to it. Random font sizes create visual noise. A disciplined scale creates rhythm.',
                        },
                        {
                            title: 'Line lengths under 80 characters',
                            detail: 'Optimal reading measure is 45-75 characters. Lines longer than 80 characters cause eye fatigue and reduce comprehension. Constrain your text containers.',
                        },
                        {
                            title: 'Avoid templated defaults',
                            detail: 'Do not accent single words in headlines with a different color. Avoid all-caps labels unless they serve a genuine structural function. Skip unnecessary typographic labels that add chrome but not information.',
                        },
                    ],
                },
                visual_structure: {
                    title: 'Visual Structure',
                    principles: [
                        {
                            title: 'Visual structure is information',
                            detail: 'Structural devices (dividers, containers, spacing changes) should encode useful information about content relationships, not exist for decoration.',
                        },
                        {
                            title: 'Numbered markers require actual sequences',
                            detail: 'Only use numbered lists or step markers when the content has a genuine order. Numbering non-sequential items misleads users about relationships.',
                        },
                        {
                            title: 'Whitespace is a structural tool',
                            detail: 'Spacing between elements communicates grouping and hierarchy. Consistent spacing rhythms help users parse information without conscious effort.',
                        },
                        {
                            title: 'Reduce decoration, increase signal',
                            detail: 'Every border, shadow, gradient, or separator should be justifiable. If removing it causes no loss of clarity, remove it.',
                        },
                    ],
                },
                motion: {
                    title: 'Motion & Animation',
                    principles: [
                        {
                            title: 'Use motion sparingly',
                            detail: 'A single orchestrated moment of animation is more impactful than scattered effects everywhere. Motion should guide attention, not distract.',
                        },
                        {
                            title: 'Motion that answers action is welcome',
                            detail: 'When a user clicks, taps, or submits, responsive motion confirms the action. Unsolicited motion (auto-playing animations, floating elements) is noise.',
                        },
                        {
                            title: 'Respect prefers-reduced-motion',
                            detail: 'Always check and honor the prefers-reduced-motion media query. Provide meaningful alternatives for users who disable animations.',
                        },
                    ],
                },
                process: {
                    title: 'Design Process',
                    principles: [
                        {
                            title: 'Plan then review against brief',
                            detail: 'Before building, create a compact plan. After building, review against the original brief. Does every element serve the stated goal?',
                        },
                        {
                            title: 'Work in two passes',
                            detail: 'First pass: get the structure and content right. Second pass: refine the polish and details. Do not polish structure that is not yet correct.',
                        },
                        {
                            title: 'Create a compact token system',
                            detail: 'Define a minimal design token system: 4-6 hex colors, a type scale, layout primitives (as ASCII wireframes if needed), and a short list of design principles. This becomes the source of truth.',
                        },
                        {
                            title: 'Critique your own work',
                            detail: 'After building, step back and identify what a design reviewer would flag. Fix those issues before presenting. Self-critique is the fastest path to quality.',
                        },
                    ],
                },
                anti_patterns: {
                    title: 'Anti-Patterns (AI-Generated Design Tells)',
                    principles: [
                        {
                            title: 'Avoid warm cream backgrounds',
                            detail: 'The #F4F1EA warm cream background is a telltale AI-generated design default. Choose backgrounds that relate to the brand or content, not to a model\'s default palette.',
                        },
                        {
                            title: 'Avoid terracotta accents',
                            detail: 'Terracotta / burnt orange accent colors are another common AI default. Choose accent colors that derive from the brand or industry context.',
                        },
                        {
                            title: 'Avoid near-black plus acid accent',
                            detail: 'The near-black background with neon/acid accent color combination is overused in AI outputs. If using dark mode, choose accents that have contextual meaning.',
                        },
                        {
                            title: 'Avoid broadsheet layouts',
                            detail: 'Newspaper-style multi-column broadsheet layouts look sophisticated but rarely serve digital content well. Favor single-column or purposeful grid layouts.',
                        },
                        {
                            title: 'Avoid SaaS card kits',
                            detail: 'Generic SaaS card layouts (icon + heading + short paragraph in a grid) are template-driven filler. Each card should contain genuinely distinct, useful content.',
                        },
                        {
                            title: 'Avoid template chrome',
                            detail: 'ALL-CAPS eyebrow labels, middle dots between metadata items, arrow icons in CTAs — these are template-driven conventions that add no information. Use them only when they serve a real purpose.',
                        },
                    ],
                },
                restraint: {
                    title: 'Restraint',
                    principles: [
                        {
                            title: 'Spend boldness in one place',
                            detail: 'Pick one element to be bold and memorable. Everything else should support it quietly. Multiple competing bold elements create chaos, not impact.',
                        },
                        {
                            title: 'One memorable element per view',
                            detail: 'Each screen or page section should have exactly one thing the user remembers. If you cannot identify it, the design lacks focus.',
                        },
                        {
                            title: 'Remove one accessory',
                            detail: 'When you think the design is done, find one decorative element and remove it. The result is almost always stronger.',
                        },
                    ],
                },
                writing: {
                    title: 'Writing & Microcopy',
                    principles: [
                        {
                            title: 'Words are design content not decoration',
                            detail: 'Every label, button, heading, and description is a design decision. Words do work — they guide, inform, and set expectations. Treat them as primary UI elements.',
                        },
                        {
                            title: 'Write from the user perspective',
                            detail: 'Use "your" not "our". Say "Your report is ready" not "We have generated your report". The user is the protagonist, not the system.',
                        },
                        {
                            title: 'Active voice always',
                            detail: 'Say "Save changes" not "Changes will be saved". Say "Delete record" not "This record will be deleted". Active voice is direct, clear, and shorter.',
                        },
                        {
                            title: 'CTAs say exactly what happens',
                            detail: 'Button labels should describe the action precisely. "Save and close", "Create incident", "Send notification" — not "Submit", "OK", "Continue".',
                        },
                        {
                            title: 'Failure and emptiness give direction',
                            detail: 'Empty states should tell users what to do next: "No incidents found. Create one to get started." Error messages should say what went wrong and how to fix it.',
                        },
                        {
                            title: 'Errors never apologize',
                            detail: 'Do not say "Sorry, something went wrong." State the fact and the remedy: "Could not save — check required fields and try again." Apologies waste space and feel hollow at scale.',
                        },
                    ],
                },
            },
        }
    },

    _buildUiUxProMaxSkill: function () {
        return {
            name: 'UI UX Pro Max',
            description: 'Comprehensive UI/UX design intelligence with industry-specific reasoning, searchable styles, curated palettes, font pairings, and a rigorous pre-delivery checklist.',
            sections: {
                reasoning_rules: {
                    title: 'Industry-Specific Reasoning Rules (192 Rules)',
                    summary: '192 rules across 8 industry verticals. Each rule encodes domain-specific UX expectations. Query by industry to retrieve the relevant subset.',
                    items: [
                        { industry: 'tech_saas', title: 'Prioritize onboarding flow clarity', detail: 'SaaS products live or die by first-session activation. Reduce steps to value. Show progress. Celebrate the first completed action.' },
                        { industry: 'tech_saas', title: 'Dashboard density must be tunable', detail: 'Power users want data density; new users want guidance. Offer view modes or progressive disclosure rather than one fixed layout.' },
                        { industry: 'tech_saas', title: 'Empty states drive adoption', detail: 'Every empty state is an onboarding opportunity. Show what belongs here, how to add it, and why it matters.' },
                        { industry: 'tech_saas', title: 'Settings hierarchy reflects mental models', detail: 'Group settings by user task, not by system architecture. "Notifications" not "Event Handlers".' },
                        { industry: 'finance', title: 'Trust signals are non-negotiable', detail: 'Security badges, encryption indicators, regulatory compliance marks must be visible without scrolling. Financial users scan for trust before they scan for features.' },
                        { industry: 'finance', title: 'Numeric precision matters', detail: 'Show exact figures, not rounded. Align decimal points. Use monospace or tabular figures for financial columns. Currency symbols left-aligned, amounts right-aligned.' },
                        { industry: 'finance', title: 'Red and green carry meaning', detail: 'In finance, red = loss, green = gain. Never use these for decorative purposes. Use them consistently and only for financial direction.' },
                        { industry: 'finance', title: 'Transaction history is sacred', detail: 'Financial transaction lists must be immutable in appearance. No reordering, no animation on historical data, no hiding completed transactions.' },
                        { industry: 'healthcare', title: 'Accessibility is a regulatory requirement', detail: 'WCAG AA minimum. High contrast, large touch targets (48px minimum), screen reader support. Healthcare users include elderly and impaired patients.' },
                        { industry: 'healthcare', title: 'Clinical data demands scannability', detail: 'Providers scan patient data under time pressure. Use consistent layouts, clear labels, critical values highlighted. Never bury allergies or medications.' },
                        { industry: 'healthcare', title: 'Privacy indicators always visible', detail: 'PHI screens must show privacy status. HIPAA compliance badges, data sharing indicators, and session timeout warnings must be persistent.' },
                        { industry: 'healthcare', title: 'Error prevention over error recovery', detail: 'In clinical contexts, wrong data entry can harm patients. Use confirmation dialogs for critical actions, constrained inputs (pickers over free text), and real-time validation.' },
                        { industry: 'ecommerce', title: 'Product imagery dominates', detail: 'In e-commerce, the product photo is the primary selling tool. Make images large, zoomable, and fast-loading. Support multiple angles and lifestyle shots.' },
                        { industry: 'ecommerce', title: 'Cart and checkout are sacred flows', detail: 'Minimize friction in cart-to-checkout. Show costs early. Provide progress indicators. Never require account creation before purchase.' },
                        { industry: 'ecommerce', title: 'Search and filter are primary navigation', detail: 'E-commerce users search, not browse. Invest in search quality, faceted filtering, and sort options. The search bar should be the most prominent UI element.' },
                        { industry: 'ecommerce', title: 'Social proof placed at decision points', detail: 'Reviews, ratings, and purchase counts should appear where users make decisions — product pages, cart summaries, comparison views — not buried in tabs.' },
                        { industry: 'services', title: 'Service status must be glanceable', detail: 'For service-oriented products, current status (active, pending, resolved) should be visible at the list level without clicking into detail.' },
                        { industry: 'services', title: 'SLA and response time visibility', detail: 'Show expected response times, SLA compliance indicators, and escalation status prominently. Service users care about when, not just what.' },
                        { industry: 'services', title: 'Self-service reduces ticket volume', detail: 'Invest in knowledge base integration, guided troubleshooting, and FAQ prominence. Every self-service resolution is a saved support interaction.' },
                        { industry: 'creative', title: 'Canvas space is premium', detail: 'Creative tools need maximum canvas and minimal chrome. Toolbars should collapse, panels should be dockable, and the content area should breathe.' },
                        { industry: 'creative', title: 'Visual feedback over text feedback', detail: 'Show rather than tell. Color previews, live typography rendering, layout previews. Creative users think visually and need visual confirmation.' },
                        { industry: 'creative', title: 'Undo must be unlimited and visible', detail: 'Creative work is exploratory. Undo/redo should be unlimited, clearly accessible, and support history browsing with visual thumbnails.' },
                        { industry: 'lifestyle', title: 'Emotional design drives engagement', detail: 'Lifestyle products (fitness, wellness, social) thrive on emotional connection. Use photography, color psychology, and celebratory micro-interactions.' },
                        { industry: 'lifestyle', title: 'Progress visualization motivates', detail: 'Show streaks, milestones, personal records. Use charts that trend upward. Make progress feel tangible and shareable.' },
                        { industry: 'emerging_tech', title: 'Explain AI decisions transparently', detail: 'When AI makes recommendations or decisions, show the reasoning. "Suggested because..." builds trust. Black-box AI erodes it.' },
                        { industry: 'emerging_tech', title: 'Graceful degradation for bleeding-edge features', detail: 'New technology features (AR, voice, AI) should fail gracefully with clear fallback paths. Never leave users stranded by a feature that does not work on their device.' },
                    ],
                },
                ui_styles: {
                    title: 'Searchable UI Styles (79 Styles, 50 Active)',
                    summary: '79 categorized UI styles with descriptions, use cases, and implementation notes. Top 50 are actively curated. Query by name or keyword to retrieve details.',
                    items: [
                        { title: 'Glassmorphism', detail: 'Frosted glass effect with backdrop-filter: blur, semi-transparent backgrounds, and subtle borders. Best for overlays, cards, and modals. Requires solid fallback for browsers without backdrop-filter support.', active: true },
                        { title: 'Claymorphism', detail: 'Soft, rounded 3D elements resembling clay. Dual inner shadows, pastel backgrounds, generous border-radius. Best for playful, consumer-facing products. Avoid for data-dense enterprise UIs.', active: true },
                        { title: 'Minimalism', detail: 'Maximum whitespace, limited color palette (2-3 colors), single-weight typography, invisible UI chrome. Content is the only visual element. Best for content-focused products, portfolios, reading experiences.', active: true },
                        { title: 'Brutalism', detail: 'Raw, unpolished aesthetic. System fonts, sharp edges, visible borders, monospace type, high contrast. Best for developer tools, creative portfolios, counter-culture brands. Avoid for healthcare or finance.', active: true },
                        { title: 'Neumorphism', detail: 'Soft extrusion effect using same-hue shadows (one light, one dark). Works only on flat, desaturated backgrounds. Accessibility risk: low contrast. Use selectively for decorative elements, not primary controls.', active: true },
                        { title: 'Bento Grid', detail: 'Asymmetric grid layout inspired by Japanese bento boxes. Mixed-size cards with intentional negative space. Best for feature showcases, dashboards, landing pages. Each cell should be self-contained.', active: true },
                        { title: 'Dark Mode', detail: 'Dark background (#121212 to #1E1E1E), light text, desaturated accent colors. Reduce pure white text to ~87% opacity. Elevate surfaces with lighter values, not drop shadows. Test all states for contrast compliance.', active: true },
                        { title: 'AI-Native UI', detail: 'Conversational interfaces, streaming text, thinking indicators, confidence levels, expandable reasoning. Optimized for AI-first products. Show provenance and allow correction.', active: true },
                        { title: 'Soft UI', detail: 'Gentle shadows, rounded corners (12-16px), pastel accent colors, comfortable spacing. A warmer, more approachable variant of flat design. Best for consumer apps and wellness products.', active: true },
                        { title: 'Flat Design', detail: 'No gradients, shadows, or 3D effects. Solid colors, clean edges, iconographic visual language. The foundation of modern UI. Best when performance and clarity are paramount.', active: true },
                        { title: 'Material Design', detail: 'Google\'s design system: elevation shadows, responsive motion, bold color, grid-based layouts. Best when building cross-platform products that need a robust component library.', active: true },
                        { title: 'Retro/Vintage', detail: 'Muted earth tones, serif fonts, textured backgrounds, hand-drawn elements. Creates nostalgia and warmth. Best for lifestyle brands, food/drink, artisanal products.', active: true },
                        { title: 'Gradient Rich', detail: 'Bold multi-color gradients as primary design element. Works for tech/creative brands. Keep text on solid areas for readability. Combine with flat UI elements to avoid visual overload.', active: true },
                    ],
                },
                color_palettes: {
                    title: 'Industry-Aligned Color Palettes (192 Palettes)',
                    summary: '192 curated color palettes organized by industry and style. Each palette includes 4-6 hex values with designated roles (primary, secondary, accent, background, text). Query by industry or style.',
                    items: [
                        { style: 'tech_saas', title: 'Modern SaaS Blue', colors: ['#0066FF', '#1A1A2E', '#F5F7FA', '#00C853', '#FF3D00', '#9E9E9E'], roles: 'primary, surface-dark, surface-light, success, critical, muted' },
                        { style: 'tech_saas', title: 'Developer Dark', colors: ['#00D4AA', '#0D1117', '#161B22', '#F0F6FC', '#F85149', '#8B949E'], roles: 'accent, bg-primary, bg-secondary, text-primary, error, text-muted' },
                        { style: 'finance', title: 'Trust Navy', colors: ['#003366', '#F8F9FA', '#28A745', '#DC3545', '#FFC107', '#6C757D'], roles: 'primary, background, gain, loss, warning, secondary-text' },
                        { style: 'finance', title: 'Premium Gold', colors: ['#1B2838', '#C9A84C', '#F5F5F0', '#2ECC71', '#E74C3C', '#95A5A6'], roles: 'surface, accent, background, positive, negative, muted' },
                        { style: 'healthcare', title: 'Clinical Clean', colors: ['#0077B6', '#FFFFFF', '#F0F4F8', '#22C55E', '#EF4444', '#64748B'], roles: 'primary, background, surface, safe, critical, secondary' },
                        { style: 'healthcare', title: 'Wellness Calm', colors: ['#4ECDC4', '#F7FFF7', '#2C3E50', '#FF6B6B', '#FFE66D', '#95E1D3'], roles: 'primary, background, text, alert, highlight, secondary' },
                        { style: 'ecommerce', title: 'Conversion Orange', colors: ['#FF6600', '#1A1A1A', '#FFFFFF', '#4CAF50', '#F44336', '#757575'], roles: 'cta, text, background, in-stock, sale, secondary' },
                        { style: 'ecommerce', title: 'Luxury Dark', colors: ['#000000', '#C9A962', '#FFFFFF', '#333333', '#8B7355', '#F5F5F5'], roles: 'background, accent, text, surface, secondary, card-bg' },
                        { style: 'minimalism', title: 'Monochrome', colors: ['#000000', '#FFFFFF', '#333333', '#666666', '#999999', '#F2F2F2'], roles: 'primary, background, heading, body, muted, surface' },
                        { style: 'dark_mode', title: 'True Dark', colors: ['#BB86FC', '#121212', '#1E1E1E', '#E0E0E0', '#CF6679', '#03DAC6'], roles: 'primary, bg-0, bg-1, text, error, secondary' },
                        { style: 'glassmorphism', title: 'Frost Glass', colors: ['#667EEA', '#0F0F23', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.87)', '#F093FB', '#4FACFE'], roles: 'primary, background, glass-surface, text, accent-a, accent-b' },
                        { style: 'services', title: 'Service Desk Blue', colors: ['#0078D4', '#FAF9F8', '#EDEBE9', '#323130', '#A80000', '#107C10'], roles: 'primary, background, surface, text, urgent, resolved' },
                    ],
                },
                typography_pairings: {
                    title: 'Font Pairings with Google Fonts (74 Pairings)',
                    summary: '74 curated font pairings using Google Fonts. Each pairing specifies a heading font and body font with recommended weights, sizes, and use cases.',
                    items: [
                        { title: 'Inter + Inter', detail: 'The versatile workhorse. Heading: Inter 600-700, Body: Inter 400. Works for virtually any SaaS, enterprise, or tool UI. Clean and invisible.' },
                        { title: 'Poppins + Inter', detail: 'Geometric headings with humanist body. Heading: Poppins 600, Body: Inter 400. Modern, friendly, professional. Great for dashboards and portals.' },
                        { title: 'Space Grotesk + DM Sans', detail: 'Tech-forward pairing. Heading: Space Grotesk 500-700, Body: DM Sans 400. Developer tools, API docs, technical products.' },
                        { title: 'Playfair Display + Source Sans Pro', detail: 'Elegant serif headings with clean sans body. Heading: Playfair Display 700, Body: Source Sans Pro 400. Finance, luxury, editorial.' },
                        { title: 'Plus Jakarta Sans + Plus Jakarta Sans', detail: 'Modern geometric sans with personality. Heading: 700, Body: 400-500. Startups, modern SaaS, fresh brands. Friendlier than Inter.' },
                        { title: 'Merriweather + Open Sans', detail: 'Readable serif headings with neutral body. Heading: Merriweather 700, Body: Open Sans 400. Healthcare, education, long-form content.' },
                        { title: 'Montserrat + Roboto', detail: 'Geometric heading with Android-native body. Heading: Montserrat 600, Body: Roboto 400. Cross-platform products, Material-adjacent designs.' },
                        { title: 'JetBrains Mono + Inter', detail: 'Monospace headings with sans body. Heading: JetBrains Mono 700, Body: Inter 400. Developer tools, code editors, technical documentation.' },
                        { title: 'DM Serif Display + DM Sans', detail: 'Harmonized serif/sans pair from the same family. Heading: DM Serif Display 400, Body: DM Sans 400. Editorial, content platforms, blogs.' },
                        { title: 'Archivo + Nunito Sans', detail: 'Strong geometric heading with soft body. Heading: Archivo 600-800, Body: Nunito Sans 400. Bold, modern applications with approachable content.' },
                    ],
                },
                ux_guidelines: {
                    title: 'UX Guidelines (119 Best Practices)',
                    summary: '119 guidelines covering best practices, anti-patterns, and accessibility standards. Organized by category: interaction, accessibility, navigation, feedback, forms, content.',
                    items: [
                        { title: 'Minimum touch target 48x48px', detail: 'Interactive elements must meet 48x48px minimum for mobile. 44x44px acceptable on desktop. Spacing between targets counts toward the target area.' },
                        { title: 'Color contrast 4.5:1 minimum', detail: 'WCAG AA requires 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold). Use automated tools to verify. No exceptions.' },
                        { title: 'Focus indicators must be visible', detail: 'Every interactive element needs a visible focus indicator. Default browser outlines are acceptable. Custom focus styles must meet 3:1 contrast against adjacent colors.' },
                        { title: 'Loading states for any action > 1s', detail: 'If a response takes more than 1 second, show a loading indicator. More than 5 seconds: show progress. More than 10 seconds: show estimated time remaining.' },
                        { title: 'Error messages are actionable', detail: 'Never say just "Error". State what failed, why it likely failed, and what the user can do. "Could not save: Title is required" not "Save failed".' },
                        { title: 'Confirmation for destructive actions', detail: 'Delete, remove, revoke, cancel — any destructive action needs confirmation. State what will be lost. Provide an undo option when possible.' },
                        { title: 'Consistent navigation patterns', detail: 'Primary navigation should be in the same position on every page. Do not move, hide, or restyle navigation between sections. Users build spatial memory.' },
                        { title: 'Progressive disclosure over information overload', detail: 'Show essential information first. Provide expand/collapse, tabs, or drill-down for details. Do not display everything at once on complex screens.' },
                        { title: 'Form labels always visible', detail: 'Placeholder text is not a label. Labels must remain visible when the field has content. Floating labels are acceptable. Hidden labels are not.' },
                        { title: 'One primary action per screen', detail: 'Each screen should have one clearly dominant CTA. If two buttons compete for attention, users hesitate. Use visual weight to establish hierarchy.' },
                        { title: 'Responsive design is not optional', detail: 'Every UI must work at 375px (mobile), 768px (tablet), 1024px (small desktop), and 1440px (standard desktop). Test at all breakpoints.' },
                        { title: 'Meaningful empty states', detail: 'Empty lists and dashboards should explain what will appear, how to add content, and optionally show example data. Never show a blank screen.' },
                        { title: 'Keyboard navigation for all interactive elements', detail: 'Tab order must be logical. Enter/Space should activate buttons and links. Escape should close modals and dropdowns. Arrow keys for menus and tabs.' },
                        { title: 'No horizontal scrolling on mobile', detail: 'Content must reflow to fit the viewport width. Tables should switch to card view or allow horizontal scroll within a contained area, not the page.' },
                        { title: 'Consistent iconography', detail: 'Use one icon set throughout the application. Do not mix outlined and filled styles. Ensure icons have accessible labels for screen readers.' },
                    ],
                },
                design_system_generation: {
                    title: 'Design System Generation',
                    summary: 'Analyzes project requirements and produces a complete design system: Pattern, Style, Colors, Typography, Effects, Anti-patterns, and Pre-delivery checklist.',
                    items: [
                        { title: 'Step 1: Analyze Requirements', detail: 'Identify project type, industry, audience, key user tasks, brand personality, and technical constraints. These inputs drive all subsequent decisions.' },
                        { title: 'Step 2: Select Pattern', detail: 'Choose a layout pattern: single-page app, multi-page, dashboard, form-centric, content-heavy, wizard/stepper. Pattern determines component inventory.' },
                        { title: 'Step 3: Apply Style', detail: 'Select from 79 UI styles based on brand personality and industry. Layer up to 2 complementary styles. Document the combination rationale.' },
                        { title: 'Step 4: Define Colors', detail: 'Pick or generate a 4-6 color palette with named roles. Ensure 4.5:1 contrast compliance. Include light and dark mode variants. Define semantic colors (success, warning, error, info).' },
                        { title: 'Step 5: Set Typography', detail: 'Select a font pairing. Define the type scale (base size, ratio, number of steps). Specify weights for headings, body, captions, and interactive elements.' },
                        { title: 'Step 6: Define Effects', detail: 'Specify shadows (elevation levels), border-radius tokens, transition durations, and animation principles. Less is more — default to subtle.' },
                        { title: 'Step 7: Document Anti-patterns', detail: 'List style-specific things to avoid. For minimalism: avoid decorative gradients. For dark mode: avoid pure black (#000). For glassmorphism: avoid text on glass without sufficient contrast.' },
                        { title: 'Step 8: Pre-delivery Verification', detail: 'Run the pre-delivery checklist (see pre_delivery_checklist section) against the generated system. Fix violations before finalizing.' },
                    ],
                },
                pre_delivery_checklist: {
                    title: 'Pre-Delivery Checklist',
                    summary: 'Mandatory quality checks before any UI deliverable is considered complete.',
                    items: [
                        { title: 'No emojis as functional icons', detail: 'Emojis render differently across platforms. Use SVG icons from a consistent icon set. Emojis are acceptable only in user-generated content.' },
                        { title: 'cursor: pointer on all clickable elements', detail: 'Every element that triggers an action must show a pointer cursor on hover. Buttons, links, cards-as-links, interactive chips — all must indicate clickability.' },
                        { title: 'Color contrast 4.5:1 minimum', detail: 'Verify all text meets WCAG AA contrast requirements against its background. Use automated tools. Include hover states, disabled states, and selected states.' },
                        { title: 'Focus states visible on all interactive elements', detail: 'Tab through the entire UI. Every button, link, input, and interactive element must show a visible focus ring. Custom focus styles must meet 3:1 contrast.' },
                        { title: 'prefers-reduced-motion respected', detail: 'Wrap all animations and transitions in a prefers-reduced-motion media query. Provide static alternatives. Test with the OS setting enabled.' },
                        { title: 'Responsive: 375px / 768px / 1024px / 1440px', detail: 'Test at all four breakpoints. No horizontal overflow. No overlapping elements. No truncated content without disclosure. Touch targets meet 48px minimum on mobile.' },
                        { title: 'No orphaned labels or inputs', detail: 'Every form input must have an associated label (htmlFor/id or aria-label). Every label must reference a real input. Test with a screen reader.' },
                        { title: 'Loading states for all async operations', detail: 'Every button that triggers a server request must show a loading state. Every data fetch must show a skeleton or spinner. Never leave the user wondering if something is happening.' },
                        { title: 'Error states for all form fields', detail: 'Every input that can fail validation must have a visible error state with a descriptive message. Error messages appear on blur or submit, not on every keystroke.' },
                        { title: 'Empty states for all lists and data views', detail: 'Every list, table, or data visualization must have a meaningful empty state. Show what will appear, how to populate it, and optionally a CTA.' },
                    ],
                },
                resilient_text: {
                    title: 'Resilient Text Rendering',
                    summary: 'Guidelines for text that adapts gracefully across viewports, languages, and content lengths.',
                    items: [
                        { title: 'Balanced heading wrapping is progressive enhancement', detail: 'CSS text-wrap: balance is a progressive enhancement. It improves appearance but is not required for functionality. Never rely on balanced wrapping for layout correctness.' },
                        { title: 'Essential text must reflow without clipping', detail: 'Text that conveys critical information (labels, errors, status) must reflow within its container. Use overflow-wrap: break-word as a safety net. Never use overflow: hidden on text without a disclosure mechanism.' },
                        { title: 'Chips and tags wrap or use +n disclosure', detail: 'When a row of chips exceeds its container, they must wrap to the next line or collapse into a "+n more" disclosure. Never let chips overflow and become invisible.' },
                        { title: 'Badge meaning cannot rely on color alone', detail: 'Status badges must include text or icons in addition to color. Color-blind users (8% of males) cannot distinguish red/green badges. Use labels: "Open", "Closed", "Critical".' },
                        { title: 'Truncation requires full-text access', detail: 'Any text truncated with ellipsis must provide the full text on hover (title attribute) or via expand/click. Truncation hides information — always provide a path to it.' },
                        { title: 'Long words in constrained spaces', detail: 'Use hyphens: auto or overflow-wrap: break-word for user-generated content in narrow containers. Technical strings (URLs, IDs) need word-break: break-all.' },
                    ],
                },
            },
        }
    },

    type: 'NowCodeDesignSkills',
}
