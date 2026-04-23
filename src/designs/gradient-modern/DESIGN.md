# Gradient Modern Design System

## 1. Visual Direction

This style is high-clarity, contemporary, and conversion-focused. The interface should feel premium and forward-looking, with controlled gradients used as hero atmosphere and interaction emphasis.

Design tone:

- Modern SaaS polish with clean geometry
- Vibrant gradient accents over neutral surfaces
- Strong visual hierarchy with generous spacing
- Subtle motion that supports clarity, not decoration

## 2. Color System

Use a neutral base and expressive gradients.

Base neutrals:

- Background: #0b1020
- Surface: #121a2f
- Elevated Surface: #1a2440
- Border: rgba(255, 255, 255, 0.14)
- Primary Text: #f7f9ff
- Secondary Text: #b7c2e6

Primary gradient tokens:

- Gradient A: linear-gradient(135deg, #5b8cff 0%, #8b5cf6 50%, #ec4899 100%)
- Gradient B: linear-gradient(135deg, #06b6d4 0%, #3b82f6 55%, #8b5cf6 100%)
- Gradient C: linear-gradient(135deg, #22c55e 0%, #06b6d4 45%, #3b82f6 100%)

Action colors:

- Primary CTA: #6d8dff
- Primary CTA Hover: #5c7ef5
- Focus Ring: rgba(109, 141, 255, 0.45)

## 3. Typography

Use strong, modern sans-serif pairings.

Font style guidance:

- Headings: geometric or modern sans, high contrast with tight tracking
- Body: neutral sans with high readability

Scale guidance:

- Hero title: clamp(2.2rem, 5vw, 4.2rem)
- Section title: clamp(1.5rem, 3vw, 2.2rem)
- Body: 1rem to 1.05rem
- Fine text: 0.82rem to 0.9rem

## 4. Layout and Components

Core structure:

- Full-bleed hero with gradient atmosphere
- Distinct feature cards on elevated surfaces
- Clear CTA strip with gradient-highlighted action
- Balanced whitespace and clear section boundaries

Component rules:

- Cards: rounded 14px to 18px, soft border, elevated shadow
- Buttons: rounded 10px to 12px, strong contrast, clear hover states
- Inputs: neutral surfaces with clear focus glow
- Navigation: minimal, sticky when needed, clear active state

## 5. Motion and Interaction

Motion should be smooth and informative.

Recommended behavior:

- Section reveal: opacity + translateY with 300ms to 500ms easing
- Card hover: slight lift (translateY(-4px)) and shadow increase
- Button hover: small scale (1.02) and color shift
- Gradient glow: gentle animated opacity shift only where useful

Avoid:

- Constant looping distractions
- High-amplitude movement
- Excessive parallax

## 6. Accessibility and Contrast

Accessibility is mandatory:

- Ensure all text has readable contrast over gradients
- Add solid overlays behind text on bright gradient areas
- Keep keyboard focus styles visible and consistent
- Maintain minimum 44px touch targets for primary actions

## 7. Implementation Priorities

Prioritize in this order:

1. Readable hierarchy and spacing
2. Accessible color contrast
3. Gradient usage for emphasis only
4. Motion polish after core usability is complete
