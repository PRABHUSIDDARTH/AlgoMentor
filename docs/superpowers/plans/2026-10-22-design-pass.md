# Design pass implementation plan

> Execute with superpowers:executing-plans (native, TDD). Spec: docs/superpowers/specs/2026-10-22-design-pass-design.md

Node: `source ~/.nvm/nvm.sh`. Rebuild the jar before e2e: `./mvnw -B -q package -DskipTests`.

1. **Navbar**: GooeyNav on both rows (`SectionTabs`, `SiteNav`); update `SiteNav.test.tsx`. Screenshot check light and dark. Commit.
2. **Landing**: add `bits/CountUp.tsx`; rewrite `HowItWorks`, replace `WorkspaceFeatures` with Roadmap and Learn sections, add Git section, honest `Integrations`, FAQ additions. Tests: Landing.test updated. Commit.
3. **Learn**: `ProgressRing`, track card thumbnails and due strip, timeline on track page, `extractToc`, TOC and reading progress on lessons, quiz beside text. Tests first for `extractToc` and `ProgressRing`. Commit.
4. **Today**: Card/Progress layout, `ActivityStrip` (tests first). Commit.
5. **Verify**: full unit, e2e (a11y both themes, 390px on four routes), screenshots of each page in both themes. README note. Commit.
6. **Review**: self-check against the spec rules, one fix pass.
