# Workspace design

The October 2026 redesign follows a 30-minute research and product-audit period. It focuses on finding a development, inspecting the original evidence and forming a research question.

The interface uses a compact coverage strip, a development-first desktop table, fully labelled filters and a source drawer. Phones use labelled navigation and stacked records. Product formulation names remain explicit, and approved populations and qualifiers retain the source-reviewed wording.

The research form shows its product scope and preserves the previous completed brief when a new request fails. URLs retain the active view and feed filters; browser Back and Forward restore those views. Question text and generated briefs are not embedded in shared URLs.

The evaluation presents the frozen rates on equal scales, with paired case outcomes and developer review notes. Complete model responses and traces remain in the [unchanged report](../data/evaluation/report.json), outside the initial client payload. The scores do not establish clinical accuracy.

## References

- [Linear's 2026 interface refresh](https://linear.app/now/behind-the-latest-design-refresh): hierarchy, alignment and predictable control placement.
- [Carbon data-table guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines): record scanning, toolbars and visible actions.
- [Open Targets' evidence-drawer design case study](https://blog.opentargets.org/next-gen-platform-released/): source inspection within a research workflow.
- [Primer filtering](https://primer.style/product/scenario-patterns/filter/) and [error recovery](https://primer.style/product/ui-patterns/degraded-experiences/): labelled scope, URL state and useful degraded states.
- [GOV.UK type scale](https://design-system.service.gov.uk/styles/type-scale/): consistent, readable typography.
- [W3C dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) and [reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): keyboard focus, dismissal and narrow-screen reading.

## Verification

`tools/ui_qa.py` checks the production-built interface with Playwright. Investigation responses are explicitly intercepted with frozen-result fixtures for success, pending and quota-error states; this script makes no live model calls. It covers filters, sorting, URL restoration, browser history, dialog focus, exported source links, retained output and multiple viewport widths.

An optional local axe-core script enables automated WCAG-rule scans. These checks supplement visual and keyboard review; they are not a full accessibility certification or a study with recruited users. Existing hosted inference and Redis verification remain separate in [hosted QA](../reports/hosted-qa.json).

```bash
# With a Next.js production server running:
python tools/ui_qa.py --url http://127.0.0.1:3000 --axe /path/to/axe.min.js
```
