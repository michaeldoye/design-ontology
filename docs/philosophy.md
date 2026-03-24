# Why Design Ontology Exists

## The convergence problem

Something has gone wrong with AI-generated interfaces. Studies and informal analyses — including observations from RedMonk and others tracking the AI tooling space — suggest that roughly 82% of AI-generated application layouts share effectively identical structure. Open any AI-coded side project from the last two years and you will find the same page: a centered card, a gradient background, rounded corners, a sans-serif heading, and a call-to-action button that looks like every other call-to-action button on the internet.

This is the shadcn/ui monoculture. Not because shadcn/ui is bad — it is a well-designed component library — but because it has become the default answer when an AI model is asked to build an interface. The training data converges. The outputs converge. The result is a generation of applications that are visually indistinguishable from one another.

The problem is not aesthetics. The problem is that convergence erases context. A medical records dashboard should not look like a social media feed. A tool for Dutch construction engineers should not look like a tool for Japanese retail consumers. When every AI reaches for the same layout, it is because the AI has no structured access to the reasoning that would differentiate these cases.

Design ontology exists to provide that reasoning.

## Why design tokens are necessary but insufficient

Design tokens were an important step. They gave us a shared vocabulary: `color.primary.500`, `spacing.md`, `font.size.lg`. They made it possible to enforce consistency across platforms and to swap themes without rewriting components.

But tokens are flat key-value pairs. They encode decisions, not reasoning. A token can tell you that the primary button color is `#2563EB`. It cannot tell you why that color was chosen, under what conditions it should change, or whether it is appropriate for a given user's emotional state.

Consider a concrete question: "Should this button be prominent or subdued given that the user just received an error message and is likely frustrated?" A token system has no way to represent this question, let alone answer it. The token knows what value to apply. It has no concept of when, why, or for whom.

Tokens are the atoms of design. You need them. But atoms alone do not explain chemistry.

## Why design systems are necessary but insufficient

Design systems go further. They organize tokens into components, components into patterns, patterns into pages. They document usage guidelines, accessibility requirements, and interaction states. Mature systems like Material Design, Polaris, or Carbon are genuine achievements of design engineering.

But design systems are trees — component hierarchies. They are not graphs. They encode structure (a Button lives inside a Card which lives inside a Page) but not the cross-cutting reasoning that connects user psychology to visual decisions.

A design system can document that a data table component exists and how to use it. It cannot represent the chain of reasoning: "Dutch construction professionals need high data density because Northern European professional culture expects information-rich interfaces, AND because the cognitive load patterns of expert users in safety-critical domains favor simultaneous visibility over progressive disclosure."

That reasoning crosses boundaries — from cultural context to cognitive psychology to information architecture to component configuration. It is not hierarchical. It is a graph. Design systems, by their tree-shaped nature, cannot capture it.

## Why the ontology is ideal for machines

Designers carry this cross-cutting reasoning in their heads. A senior designer intuitively knows that a tool for financial traders needs to feel different from a tool for kindergarten teachers, and can articulate the chain of reasoning if pressed. But that reasoning lives in experience, in conversation, in Figma comments that get deleted — not in any structured form that a machine can traverse.

This is the core proposition of design ontology: take implicit designer intuition and make it explicit, structured, and queryable.

An ontology is a knowledge graph. Nodes represent concepts — user intents, psychological principles, cultural patterns, visual properties, component behaviors. Edges represent relationships — "influences," "requires," "contradicts," "amplifies." The graph is machine-traversable by nature. This is what graphs are for.

When an AI generates a button, instead of defaulting to whatever its training data suggests, it can traverse from the declared user intent ("complete a high-stakes financial transaction") through psychological nodes ("high-stakes decisions require reduced cognitive load and clear visual hierarchy") through cultural nodes ("the target audience expects conservative, information-dense interfaces") to arrive at specific visual decisions — not just pick a token from a list.

The difference is between an AI that produces a button and an AI that produces the right button for this user, this context, this intent.

## The Palantir parallel

Palantir's Foundry Ontology provides a useful analogy. Palantir built an operational layer that maps real-world objects — aircraft, supply chains, patients, financial instruments — and their relationships into a structured knowledge graph. Applications do not query raw data; they query the ontology. The ontology encodes not just what exists but how things relate, enabling decision-making that would be impossible from flat data alone.

Design ontology applies the same architectural idea to design decisions. The "real-world objects" are design concepts: user psychology, cultural context, audience characteristics, visual principles, interaction patterns. The "relationships" are the reasoning chains that connect them. The "applications" are AI agents — tools like Figma AI, Vercel's v0, or any future system that generates interfaces.

Where Palantir's ontology asks "what is the relationship between this supplier and this logistics route?", design ontology asks "what is the relationship between this user's cultural context and the appropriate information density?" Both turn unstructured domain knowledge into structured, queryable reasoning.

## The open-spec argument

If this idea has value, it should be a standard, not a product.

The risk is already visible. Every major design tool vendor is building some form of "design intelligence" — Figma AI generates layouts, Vercel's v0 generates components, and others are close behind. If each vendor builds a proprietary reasoning layer, we get fragmentation. Your design reasoning is locked into one tool. Your ontology cannot inform another tool's decisions. Interoperability disappears.

An open schema avoids this. If the ontology follows a published specification, any tool can read any ontology. A design team can encode their reasoning once and have it inform AI generation across Figma, code generation tools, testing frameworks, and whatever comes next. The ontology becomes infrastructure, not a feature.

This is the same argument that drove design tokens toward standardization (the W3C Design Tokens Community Group) and the same argument that made OpenAPI valuable for APIs. Shared schemas create ecosystems. Proprietary schemas create silos.

Design ontology should be an open specification that anyone can implement, extend, and contribute to.

## Honest limitations and open questions

Intellectual honesty requires acknowledging what this approach cannot yet do and where it may struggle.

**The ontology is only as good as its source material.** The current approach generates ontology nodes from design specifications — written documents that describe a design system's intent, audience, and reasoning. If the spec is shallow, the ontology will be shallow. Garbage in, garbage out. This is a fundamental constraint, not a bug to be fixed.

**Fuzzy text matching has limits.** Extracting structured reasoning from unstructured prose relies on natural language processing — pattern matching, entity extraction, semantic similarity. These techniques are imperfect. They will miss nuance, misclassify intent, and occasionally produce nonsensical connections. The extraction pipeline is a best-effort system, not an oracle.

**The schema will evolve.** The current node types and relationship categories are a starting point. Real-world use will reveal missing concepts, unnecessary distinctions, and structural problems. The schema should be versioned and expected to change. Treating any early version as final would be a mistake.

**Cultural nodes are hard to validate objectively.** Claims like "Dutch professionals expect information-dense interfaces" are generalizations. They may be useful generalizations backed by research, but they are not universal truths. Cultural reasoning in the ontology should be treated as heuristic, not deterministic — a starting point for design decisions, not a substitute for user research.

**AI-generated ontologies need human review.** If an AI agent generates or extends ontology nodes, a human designer must review the result. The ontology encodes design reasoning, and design reasoning requires judgment. Full automation of ontology creation is not a near-term goal and may not be a desirable one.

These are not reasons to abandon the approach. They are reasons to adopt it with appropriate expectations. The ontology is a tool for augmenting design reasoning, not replacing it. It makes implicit knowledge explicit and queryable. It does not make fallible knowledge infallible.

---

The gap in AI-generated design is not capability — it is context. Models can generate interfaces. They cannot yet reason about whether those interfaces are appropriate for the people who will use them. Design ontology is an attempt to close that gap: structured, traversable, open, and honest about its own limits.
