/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // Enable class-based dark mode
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // === LOCKED COLOR RULES ===
                // Beige (#F2ECE3) = app background (EVERYWHERE - no white, no dark)
                // Clay (#B86445) = intent/asking actions ONLY
                // Sage = reassurance/agreed states
                // Ochre (#B89645) = caution/overdue ONLY
                // NO blue, NO neon, NO saturated greens
                // This is social infrastructure, not a marketplace

                // Philosophy-aligned boho palette (exact specs)
                boho: {
                    // Base (60-70% of UI)
                    bg: '#F2ECE3',        // warm beige - paper feel
                    paper: '#F7F2EB',     // soft cream — slightly lighter than bg, for inset cards
                    // Surfaces (cards, nav)
                    card: '#CFC6B8',      // soft taupe
                    // Text
                    text: '#433D36',      // warm charcoal (primary)
                    'text-secondary': '#726A60',  // muted brown-grey
                    // Accents (≤5%)
                    accent: '#B86445',    // muted clay
                    warning: '#B89645',   // dusty ochre
                    // Structure
                    divider: '#DDD5CB',   // paper grey
                    // Dark mode
                    'dark-bg': '#2A1F1A',
                    'dark-card': '#3D2E24',
                    'dark-text': '#F2ECE3',
                },
                // Muted sage green - calm, trustworthy (library walls)
                sage: {
                    50: '#f6f7f6',
                    100: '#e8ebe9',
                    200: '#d1d8d4',
                    300: '#b3bfb8',
                    400: '#8a9a91',
                    500: '#6b7c73',
                    600: '#566359',
                    700: '#42504a',
                    800: '#36423d',
                    900: '#2a3430',
                },
                // Warm clay - accent (use sparingly!)
                clay: {
                    50: '#faf6f3',
                    100: '#f4ede8',
                    200: '#e8dcd1',
                    300: '#d5c0ac',
                    400: '#c49b7e',
                    500: '#b08968',
                    600: '#9a7456',
                },
                // Warm neutrals
                warm: {
                    bg: '#faf9f7',
                    card: '#f6f5f3',
                    text: '#494440',
                    muted: '#7c7874',
                    border: '#e5e3e0',
                },
            },
        },
    },
    plugins: [],
}
