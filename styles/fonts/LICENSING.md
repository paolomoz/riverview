# Font licensing — ACTION REQUIRED BEFORE PRODUCTION (`aem.live`)

| File | Family | Foundry | License | Status |
|---|---|---|---|---|
| parabolica-400/700/900.woff2 | Parabolica | Adobe Fonts (Typekit) | **Proprietary / private web license** | ⚠️ UNVERIFIED |
| parabolica-text-400/700/900.woff2 | Parabolica Text | Adobe Fonts (Typekit) | **Proprietary / private web license** | ⚠️ UNVERIFIED |

Parabolica is a proprietary Adobe Fonts superfamily. It is self-hosted here for
brand fidelity (extracted woff2 from the approved prototypes). **Do not publish
to `aem.live` until the webfont/self-hosting license is confirmed** with the
brand owner / Adobe Fonts account (Typekit kit gwk6iao).

## Remove path (if licensing cannot be confirmed)
Delete the six `parabolica*.woff2` files and their `@font-face` rules in
`styles/styles.css`. The font stacks then fall back to the metric-matched
`"Arial"` override (already declared) → no CLS, graceful degradation to a
system sans. Update the banner in `styles.css`.
