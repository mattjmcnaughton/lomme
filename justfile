# Check formatting
fmt:
    pnpm biome format .

# Fix formatting
fmt-fix:
    pnpm biome format --write .

# Check linting
lint:
    pnpm biome lint .

# Fix linting
lint-fix:
    pnpm biome lint --write .

# Run type checker
typecheck:
    pnpm exec vite build
    pnpm exec tsc -b

# Run all tests
test-all: test-unit test-integration test-e2e

# Run unit tests (co-located in src/)
test-unit:
    pnpm vitest run src/ --passWithNoTests

# Run integration tests
test-integration:
    pnpm vitest run tests/integration --passWithNoTests

# Run e2e tests
test-e2e:
    pnpm exec playwright test

# Run tests that hit external services
test-external:
    pnpm vitest run -t external --passWithNoTests

# Fast pre-push check
gate: fmt lint typecheck test-unit

# Full check
gate-expensive: gate test-integration test-e2e

# Everything including external
gate-external: gate-expensive test-external

# Start dev server
dev:
    pnpm vite

# Build and verify the image used by Fly
compose-smoke:
    bash scripts/compose-smoke.sh
