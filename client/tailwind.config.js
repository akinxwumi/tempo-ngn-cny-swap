/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx}",
        "./components/**/*.{js,jsx}",
        "./lib/**/*.js",
    ],
    theme: {
        extend: {
            fontFamily: {
                mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", '"SF Mono"', "Menlo", "Consolas", "monospace"],
            },
            colors: {
                surface: {
                    root: "#07080a",
                    sidebar: "#0c0d10",
                    main: "#0f1014",
                    card: "#141519",
                    input: "#0e0f13",
                    elevated: "#1a1b22",
                    hover: "#1c1d26",
                },
                ink: {
                    1: "#edeef2",
                    2: "#8a8ea0",
                    3: "#52556a",
                },
                accent: {
                    DEFAULT: "#5b7fff",
                    hover: "#6e8fff",
                    dim: "rgba(91, 127, 255, 0.1)",
                    glow: "rgba(91, 127, 255, 0.2)",
                },
                success: {
                    DEFAULT: "#2dd4a0",
                    dim: "rgba(45, 212, 160, 0.1)",
                },
                danger: {
                    DEFAULT: "#f06464",
                    dim: "rgba(240, 100, 100, 0.1)",
                },
            },
            animation: {
                "pulse-slow": "pulse 2s ease-in-out infinite",
                "spin-once": "spin 0.5s linear",
                "slide-in": "slideIn 0.2s ease",
                "drop-in": "dropIn 0.15s ease",
                "fade-in": "fadeIn 0.15s ease",
            },
            keyframes: {
                slideIn: {
                    from: { opacity: "0", transform: "translateY(-4px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                dropIn: {
                    from: { opacity: "0", transform: "translateY(-4px) scale(0.98)" },
                    to: { opacity: "1", transform: "translateY(0) scale(1)" },
                },
                fadeIn: {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
            },
        },
    },
    plugins: [],
};
