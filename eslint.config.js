import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {ignores:['dist','coverage','node_modules']},
  {
    files:['src/**/*.{ts,tsx}'],
    plugins:{'@typescript-eslint':tseslint.plugin,'react-hooks':reactHooks},
    languageOptions:{parser:tseslint.parser,parserOptions:{ecmaFeatures:{jsx:true}},globals:{window:'readonly',document:'readonly',navigator:'readonly',history:'readonly',crypto:'readonly',structuredClone:'readonly',URL:'readonly',URLSearchParams:'readonly',HTMLElement:'readonly',KeyboardEvent:'readonly',PromiseRejectionEvent:'readonly',File:'readonly',setTimeout:'readonly',clearTimeout:'readonly',setInterval:'readonly',clearInterval:'readonly',queueMicrotask:'readonly'}},
    rules:{
      'no-empty':'error',
      'no-unreachable':'error',
      'react-hooks/rules-of-hooks':'error',
      'react-hooks/exhaustive-deps':'warn',
      '@typescript-eslint/no-unused-vars':['warn',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}],
    },
  },
)
