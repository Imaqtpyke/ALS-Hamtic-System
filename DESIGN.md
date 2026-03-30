# Design System: The Academic Editorial (ALS Redesign)

This design system is built to elevate the ALS Enrollment experience into a professional, modern, and welcoming digital platform. It moves away from rigid legacy layouts in favor of expansive white space and intentional typography.

---

## 🎨 Color Palette

| Token | Hex | Usage |
| :--- | :--- | :--- |
| **Primary (DepEd Blue)** | `#0038A8` | Branding, Headers, Primary Buttons, Authority elements |
| **Base (White)** | `#FFFFFF` | Backgrounds, Card surfaces, Clean canvas |
| **Accent (DepEd Red)**| `#E2231A` | High-priority CTAs (Enroll Now), Highlights, Success icons |
| **Surface-Low** | `#F3F3F3` | Section backgrounds to create depth without borders |
| **Surface-Lowest** | `#FFFFFF` | Primary content cards |
| **On-Surface** | `#1A1C1C` | Primary text for maximum legibility |

---

## Typography

We use **Inter** (Utility) or **Poppins** (Authoritative) to establish a clear hierarchy.

- **Display-LG (Poppins, 3.5rem)**: Hero headings, welcome messages.
- **Headline-MD (Poppins, 1.75rem)**: Section titles.
- **Body-MD (Inter, 1rem)**: Standard text, form labels, and detailed descriptions.
- **Label-SM (Inter, 0.75rem)**: Metadata, hint text, and status chips.

---

## 🧩 Component Specifications

### 1. The "No-Line" Architecture
Structural boundaries must be defined through background color shifts.
- **Do:** Place a White card on a `#F3F3F3` background.
- **Don't:** Use 1px gray borders to box content.

### 2. Button System
- **CTA (Red):** `#E2231A` background, rounded-lg (8px), white text. Reserved for "Start Enrollment".
- **Primary (Blue):** `#0038A8` background, rounded-lg. Used for "Submit", "Login", "Next".
- **Secondary (Ghost):** Blue text, no background. Used for "Back", "Cancel".

### 3. Tonal Layering (Elevation)
Achieve depth through layering, not heavy shadows.
- **Shadows:** Use hyper-diffused ambient shadows (e.g., `rgba(0, 56, 168, 0.04)`) for floating elements.

### 4. Form Fields
- Surface: White.
- Active: 2px DepEd Blue bottom-bar on focus.
- Accessibility: Minimum font size 16px on mobile to prevent auto-zoom.

---

## 📱 Mobile-First Principles
- **Touch Targets:** All interactive elements must be at least 44px in height/width.
- **Responsive Grids:** Use CSS Grid/Flex for seamless collapsing from Desktop (3 columns) to Mobile (1 column).
- **Sticky Actions:** Persistent "Resume Enrollment" or "Submit" buttons on mobile screens.
