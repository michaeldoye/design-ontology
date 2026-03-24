# EcoVoorscan — Product Specification

## What is EcoVoorscan?

EcoVoorscan is a web-based sustainability assessment platform used in the Dutch construction industry. It enables construction professionals — site managers, project leads, and ecology consultants — to assess environmental risks before and during construction projects.

The platform processes soil analysis data, ecological surveys, and regulatory requirements to generate risk assessments that determine whether a construction project can proceed, needs mitigation measures, or must be halted.

## Target Audience

### Primary: Construction Professionals
- Site managers and project leads at Dutch construction companies
- 10-30 years industry experience
- Highly technical, accustomed to data-dense engineering tools
- Work in the field on tablets and in the office on desktop
- Time-pressured: need answers quickly, not exploration
- Dutch-speaking, operating under Dutch and EU environmental law

### Secondary: Ecology Consultants
- Environmental scientists conducting field surveys
- Generate the source data that feeds into risk assessments
- Need to review and validate assessment outputs
- More detail-oriented than construction professionals
- Comfortable with scientific data formats

## Core User Flows

### 1. Risk Assessment Review
The primary flow. A construction professional opens a project, sees the overall risk score immediately, then drills into specific risk categories (soil contamination, protected species, noise impact, water table). Each category shows a severity level, required actions, and regulatory references.

### 2. Project Comparison
Compare risk profiles across multiple construction sites to prioritize which projects need immediate attention. Used during weekly planning meetings.

### 3. Report Generation
Generate PDF reports for regulatory submission. These must conform to Dutch environmental reporting standards and include all data sources, methodology references, and professional sign-offs.

### 4. Data Entry and Validation
Ecology consultants enter field survey data. The system validates entries against expected ranges and flags anomalies. Data entry happens on tablets in field conditions (variable lighting, gloved interaction).

## Brand and Tone

- **Professional and authoritative**: This is a tool for making safety-critical decisions. It must feel trustworthy.
- **Dutch directness**: No euphemisms. Risk is risk. "High risk" means high risk.
- **Data-first**: Numbers and evidence before narrative. Show the data, then the interpretation.
- **Calm confidence**: Even when showing alarming risk levels, the interface should project control and clarity, not panic.

## Cultural Context

- Dutch market, Dutch language interface
- Dutch professional culture: direct, efficient, egalitarian, pragmatic
- High data literacy among users — they expect information density similar to engineering tools
- Regulatory context: Dutch environmental law (Wet natuurbescherming) and EU directives
- Color associations: green=safe is universal, but red for danger has specific regulatory weight in Dutch construction

## Accessibility Requirements

- WCAG 2.1 AA compliance minimum
- Must work on tablets in outdoor conditions (high contrast, large touch targets)
- Color must never be the sole indicator of risk level (icon + color + text)
- Support for screen readers on report pages
- All risk levels must have text labels, not just color coding

## What EcoVoorscan is NOT

- It is NOT a consumer app — no onboarding wizards, no gamification, no social features
- It is NOT a general-purpose dashboard — no customizable widgets, no drag-and-drop layout
- It is NOT a design showcase — aesthetics serve function, decoration is waste
- It is NOT an analytics exploration tool — users come for specific answers, not open-ended analysis
