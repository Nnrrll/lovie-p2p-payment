# Submission Cover Note

The most challenging part of this assignment was keeping the implementation honest while using an
AI-native workflow on top of an existing brownfield repository. The early state of the project had
partial implementation, stale generated files, and a few hallucinated assumptions from previous AI
passes, so the key challenge was not just adding features, but tightening the contract between the
spec, the backend behavior, the frontend flows, and the final delivery artifacts. I handled that
by working in small checkpoints and refusing to move on to a larger milestone until the smaller
one was verifiably correct.

AI tools helped most in speed, scaffolding, and documentation throughput. I used an agentic coding
workflow to audit the repo, generate and maintain the Spec-Kit-style artifacts, implement the
feature, and harden the test and deployment paths. At the same time, AI also created the main risk
surface: some outputs looked plausible but were incomplete or wrong. Because of that, I treated AI
as a fast implementation partner rather than a source of truth, and used targeted verification,
smoke testing, and end-to-end checks to converge on a working result.

The final project is a deployed P2P payment request demo with a public repo, a public web app,
Spec-Kit artifacts, backend and E2E verification, and an automated reviewer-facing video artifact.
