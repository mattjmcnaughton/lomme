# Lomme Constitution

Adopted by the project owner on 2026-10-26 to guide the prototype migration
with domain-driven design, behavioral fakes, and room for a future backend
without building speculative infrastructure.

These principles are obligations for future work, not certification that the
prototype or current scaffold already satisfies them.

## 1. Musical meaning is independent of technology

Arrangement validity and musical rules must be expressible and testable without
React, Tone.js, persistence, or a network. Introduce boundaries where they
protect meaningful behavior or isolate an external dependency, not layers for
their own sake.

For example, chord transposition and trade-fours timing must not require a
rendered component or a running audio transport.

## 2. Practice does not implicitly change saved work

Practice sessions hold working changes without implicitly modifying their
source arrangements. Built-in presets are immutable. Personal arrangements have
stable identity: Save updates that identity, Save a copy creates another, and
renaming preserves identity.

Save captures the complete practice setup: chords, home key and tonality,
tempo, accompaniment patterns, practice mode, mix, count-in, metronome, scale
visibility, and descriptive information and metadata. Playback position,
playing/stopped status, and temporary UI state are not part of that saved setup.

For example, changing tempo must not overwrite a preset, and renaming a personal
arrangement must not accidentally create a duplicate.

## 3. User data has explicit compatibility contracts

Validate imported data and explicitly migrate supported older representations.
Preserve supported formats and their meaning unless the owner explicitly
approves a compatibility break. Editable names never establish identity.
Portable content need not expose internal storage identity.

For example, a TypeScript assertion is not validation of imported JSON, and a
same-name import must not establish that it replaces an existing arrangement.
Internal storage may evolve without freezing its layout, provided supported
legacy data remains readable or an approved migration handles the change.

## 4. Tests establish behavior, not implementation choreography

Test pure rules directly. At useful external boundaries, use narrow
behavior-based interfaces and stateful fakes rather than interaction mocks for
application scenarios. Real-adapter checks must establish guarantees that
depend on browser persistence, audio scheduling, or other platform behavior.

For example, a controllable playback fake can test stopping during a pending
start, but assertions about mocked Tone.js calls cannot prove synchronized
audio. An in-memory store cannot prove that legacy browser data migrates.

## 5. Infrastructure follows demonstrated needs

Keep the initial application frontend-only. Do not introduce a backend merely
to support behavior already served by browser state, audio, and files.

If server-owned capabilities are later authorized, the server must enforce
authorization and authoritative invariants for data it owns. Browser audio
timing must not depend on network round trips. This is not a promise of
permanent local-only storage or perpetual offline operation.

For example, future shared-data writes cannot trust client-only ownership
checks, and each musical beat must not require a server request.

## 6. Separate preservation from product change

Prefer the smallest design that protects current invariants. Add abstractions
and dependencies for demonstrated needs, not hypothetical future capabilities.
Migration and refactoring must not silently change product policy.

For example, extracting session logic does not authorize adding confirmation
dialogs or changing import behavior. Preserve behavior first; identify and
verify intentional policy changes separately, including the agreed move from
name-based replacement to stable arrangement identity.

## Governance and document ownership

- This constitution owns enduring constraints. When code or guidance conflicts
  with it, report the conflict rather than weakening a principle to match code.
- Architecture documentation owns concrete designs, module boundaries,
  adapters, and technology choices. Product documentation owns detailed UX;
  this constitution does not settle dirty-session switching or import audition
  versus immediate saving. Document vocabulary separately when useful.
- The owner explicitly approves meaning-changing amendments and exceptions.
  Each proposed change must state its rationale, scope, and compatibility
  consequences. Record adoption dates and rationale for amendments.
- Verification must distinguish executable evidence from human review and
  remaining gaps. This document alone proves neither coverage nor compliance.
