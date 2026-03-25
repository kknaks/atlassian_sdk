# Typing Rules

- `strict: true` in tsconfig.json
- Explicit return types on all exported functions
- Use `type` keyword for type-only imports: `import type { Foo } from "./foo.js"`
- Avoid `any` — use `unknown` and narrow with type guards
- Zod for runtime validation, TypeScript interfaces for response shapes
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `readonly` for immutable properties
- Comments and docstrings in English
