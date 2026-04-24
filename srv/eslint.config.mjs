import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: "commonjs",
            globals: {
                console: "readonly",
                process: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                URL: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                fetch: "readonly",
                require: "readonly",
                module: "writable",
                exports: "writable",
            }
        },
        rules: {
            "no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
        }
    },
    {
        files: ["**/*.mjs"],
        languageOptions: {
            sourceType: "module"
        }
    },
    {
        ignores: [
            "node_modules/",
            "types/",
            "views/",
            "app/",
        ]
    }
];
