import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
    { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...pluginVue.configs['flat/recommended'],
    {
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
            },
        },
    },
    {
        languageOptions: {
            globals: { ...globals.browser },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
                extraFileExtensions: ['.vue'],
            },
        },
        rules: {
            'no-undef': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
    {
        // These files deliberately move plain JSON in/out of typed structures at a
        // serialization boundary — `any` there is intentional, not an oversight.
        files: [
            'src/models/BaseNode.ts',
            'src/models/Serializer.ts',
            'src/models/History.ts',
            'src/__tests__/**/*.test.ts',
        ],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        },
    },
    eslintConfigPrettier,
)
