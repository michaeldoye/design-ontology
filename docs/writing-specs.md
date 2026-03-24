# Writing Product Specs for Design Ontology

The ontology that `npx design-ontology init` generates is only as good as the spec you feed it. A vague spec produces a generic ontology -- the kind that could describe any product, and therefore describes none. A precise spec produces an ontology with culture nodes, anti-patterns, and design tokens that actually fit your product.

This guide covers what to include, what to avoid, and gives you a template to start from.

---

## Key Sections to Include

### Target Audience Descriptions

Describe who your users are with enough specificity that a designer could picture them at work.

Include: expertise level, professional background, devices they use, physical environment, constraints they operate under.

**Bad:**

> Business users.

This tells us nothing. Every B2B product has "business users." The ontology cannot generate meaningful accessibility constraints, information density preferences, or cultural tone from this.

**Good:**

> Dutch construction site managers with 10-30 years of field experience. They use ruggedized tablets outdoors in variable weather. Most are not native English speakers but work in English as a compliance requirement. They are time-pressured and impatient with unnecessary UI steps.

This gives the ontology enough to reason about information density (high), language complexity (low), input methods (touch with gloves), and cultural directness norms.

---

### Core User Flows and Jobs-to-be-Done

Describe what users are trying to accomplish, not what pages or features exist. Focus on tasks, goals, and time constraints.

**Bad:**

> Dashboard page. Settings page. Reports page.

A list of pages is not a spec. It says nothing about what decisions users make, how quickly they need information, or what success looks like.

**Good:**

> Users need to assess environmental risk for a project site within 30 seconds of opening a project. They compare current sensor readings against regulatory thresholds and either approve continued work or trigger a stop-work protocol. The critical path is: open project, see status, act.

This tells the ontology about information hierarchy (status first), time pressure (30-second target), and decision structure (binary outcome). These directly shape layout patterns, color semantics, and component priority.

---

### Brand Personality and Tone

Describe how the product should feel to use, not just what it looks like. Personality drives token choices for spacing, typography weight, color saturation, and motion.

**Bad:**

> Professional.

Every enterprise product claims to be professional. This produces nothing actionable.

**Good:**

> Authoritative and direct. Dutch-style plain language -- say what you mean, skip the pleasantries. Data before narrative. Numbers are more trusted than prose. The interface should feel like a well-organized tool, not a marketing website.

This produces concrete ontology decisions: minimal decorative elements, high data density, muted color palette, no illustration-heavy empty states.

---

### Market and Cultural Context

If your product operates outside the US or serves a specific professional culture, say so explicitly. Culture nodes in the ontology come from this section. Geography, language norms, regulatory environments, and industry conventions all matter.

**Bad:**

> (Section omitted entirely.)

Without cultural context, the ontology defaults to US-centric assumptions -- English-first, left-to-right, 12-hour time, imperial units, American date formats.

**Good:**

> Primary market is the Netherlands and Belgium, with expansion into Germany. The construction industry in these markets is regulated by EU environmental directives (EED, EPBD). Regulatory compliance is not optional -- it is the reason the product exists. Users expect metric units, 24-hour time, and DD-MM-YYYY date formats. Professional communication norms favor directness over politeness.

This generates culture nodes for date/time formatting, unit systems, regulatory-driven UI patterns, and communication style.

---

### Accessibility Requirements and Constraints

State your WCAG target level and any environmental or physical constraints. These directly generate accessibility-related design tokens and anti-patterns.

**Bad:**

> Must be accessible.

This is a non-statement. Accessible to whom, under what conditions, to what standard?

**Good:**

> WCAG 2.1 AA compliance required. Users frequently operate the application outdoors on tablets in direct sunlight -- minimum contrast ratios must exceed AA minimums. Touch targets must accommodate gloved use (minimum 48px). No interactions that require fine motor precision or hover states.

This produces specific token constraints (contrast floors, touch target minimums), eliminates hover-dependent patterns, and flags outdoor-readability as a design constraint.

---

### What the Product is NOT

Boundaries are as valuable as descriptions. Anti-patterns in the ontology are generated from explicit statements about what the product should avoid.

**Bad:**

> (Section omitted entirely.)

Without boundaries, the ontology has no basis for generating anti-patterns. You get a permissive ontology that cannot warn against misguided design choices.

**Good:**

> This is not a consumer app. No gamification, achievement badges, or streak counters. No onboarding wizards -- users are trained professionals who resent being patronized. No dark patterns, no engagement metrics, no notification spam. The product succeeds when users spend less time in it, not more.

This directly generates anti-patterns: no gamification components, no multi-step onboarding flows, no engagement-driven notifications. It also shapes the ontology's success metrics toward task efficiency.

---

## Minimal Spec Template

Copy this template and fill in each section. Delete the placeholder text. If a section does not apply, write "Not applicable" with a brief reason -- do not leave it blank.

```markdown
# Product Spec: [Product Name]

## Target Audience
Who are the primary users? What is their expertise level? What devices and
environments do they work in? What constraints do they face?

[Your description here]

## Core User Flows
What are users trying to accomplish? What are the critical tasks, and what
does success look like? Include time constraints where relevant.

[Your description here]

## Brand Personality and Tone
How should the product feel? What communication style does it use? What is
it comparable to in tone (not features)?

[Your description here]

## Market and Cultural Context
Where does this product operate? What language, regulatory, or professional
norms apply? What cultural expectations shape the UI?

[Your description here]

## Accessibility Requirements
What WCAG level is required? Are there environmental constraints (outdoor use,
glare, gloves)? What device limitations exist?

[Your description here]

## What This Product is NOT
What patterns, styles, or approaches should be explicitly avoided? What would
be a wrong direction for this product?

[Your description here]
```

---

## Summary of Good vs. Bad Patterns

| Section | Bad | Good |
|---|---|---|
| Audience | "Business users" | Specific role, experience, devices, environment |
| User flows | "Dashboard page" | Task, goal, time constraint, decision structure |
| Tone | "Professional" | Specific voice, cultural style, concrete preferences |
| Culture | (omitted) | Geography, regulations, units, date formats, norms |
| Accessibility | "Must be accessible" | WCAG level, physical constraints, environmental factors |
| Boundaries | (omitted) | Explicit anti-patterns, what success is not |

The pattern across all sections is the same: specificity produces useful ontologies, vagueness produces generic ones. When in doubt, add a concrete example or a measurable constraint. The ontology generator can work with "minimum 48px touch targets" -- it cannot work with "easy to use."
