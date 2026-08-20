"""Browser checks for the redesigned workspace. No live model calls are made.

API success/error states use explicitly intercepted, frozen-result fixtures.
Run against a Next.js production server, or pass --url for a public deployment.
An optional --axe path enables an additional automated accessibility scan.
"""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://127.0.0.1:3000')
    parser.add_argument('--output', default=str(ROOT / 'reports' / 'ui-qa'))
    parser.add_argument('--axe')
    args = parser.parse_args()
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    checks, errors, audits = [], [], []

    def checked(name, condition=True):
        if not condition:
            raise AssertionError(name)
        checks.append(name)

    source_report = json.loads((ROOT / 'data/evaluation/report.json').read_text(encoding='utf-8'))
    fixture = next(item['result'] for item in source_report['cases']
                   if item['mode'] == 'agent' and item['result']['status'] == 'complete' and item['result']['facts'])
    fixture = {**fixture, 'title': 'UI state fixture: ' + fixture['title']}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(args=['--no-sandbox'])
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, accept_downloads=True)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        pending = []
        context.route('**/api/investigate', lambda route: pending.append(route))
        page.goto(args.url, wait_until='networkidle')
        expect(page.locator('.event-title')).to_have_count(29)
        checked('All 29 source records render')
        checked('Eight distinct formulation shortcuts remain available', page.locator('.watch-item').count() == 8)
        before_table = page.locator('.events-table').bounding_box()['y']
        checked('Desktop records start above 600 CSS pixels', before_table < 600)
        checked('Source boundary is visible', page.locator('.source-notice').is_visible())
        page.screenshot(path=out / 'desktop.jpg', type='jpeg', quality=65)

        def scan(label):
            if not args.axe:
                return
            page.add_script_tag(path=args.axe)
            report = page.evaluate("""async () => { const r = await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa']}}); return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),passes:r.passes.length,incomplete:r.incomplete.length}; }""")
            audits.append({'view': label, **report})
            (out / 'accessibility.json').write_text(json.dumps(audits, indent=2), encoding='utf-8')
            checked(label + ': automated WCAG rule scan has no violations', not report['violations'])

        scan('desktop feed')
        page.get_by_label('Product', exact=True).select_option('opdivo-qvantig')
        expect(page.locator('.event-title')).to_have_count(1)
        checked('SC product filtering keeps OPDIVO QVANTIG distinct')
        checked('Filter is reflected in URL', 'product=opdivo-qvantig' in page.url)
        page.reload(wait_until='networkidle')
        expect(page.locator('.event-title')).to_have_count(1)
        checked('Filtered view survives refresh')
        page.get_by_role('button', name='Reset', exact=True).click()
        page.get_by_label('Approval year', exact=True).select_option('2024')
        expect(page.locator('.event-title')).to_have_count(10)
        checked('Year filter uses approval dates')
        dates = page.locator('.date-cell time').evaluate_all('(nodes)=>nodes.map(n=>n.dateTime)')
        page.get_by_label('Sort developments').select_option('oldest')
        checked('Date sorting reverses the matching records', page.locator('.date-cell time').evaluate_all('(nodes)=>nodes.map(n=>n.dateTime)') == list(reversed(dates)))
        page.get_by_role('button', name='Reset', exact=True).click()
        page.get_by_label('Search event title or population').fill('no-such-indication-qa')
        expect(page.get_by_role('heading', name='No matching developments')).to_be_visible()
        page.get_by_role('button', name='Clear all filters').click()
        expect(page.locator('.event-title')).to_have_count(29)
        checked('Empty search offers working recovery')
        page.get_by_label('Sort developments').select_option('latest')
        opener = page.locator('.event-title').first
        opener.click()
        dialog = page.get_by_role('dialog')
        expect(dialog).to_be_visible()
        expect(page.get_by_role('button', name='Close event details')).to_be_focused()
        checked('Evidence drawer receives keyboard focus')
        checked('Official FDA source is available', dialog.get_by_role('link', name='Read the FDA announcement').get_attribute('href').startswith('https://www.fda.gov/'))
        checked('Background scrolling is contained', page.evaluate('document.body.style.overflow') == 'hidden')
        scan('evidence drawer')
        page.keyboard.press('Shift+Tab')
        checked('Reverse Tab remains inside evidence dialog', page.evaluate('document.activeElement.closest("dialog") !== null'))
        page.keyboard.press('Tab')
        expect(page.get_by_role('button', name='Close event details')).to_be_focused()
        checked('Forward Tab wraps inside evidence dialog')
        page.screenshot(path=out / 'evidence.jpg', type='jpeg', quality=60)
        page.keyboard.press('Escape')
        expect(opener).to_be_focused()
        checked('Escape restores focus to the inspected record')
        page.get_by_role('button', name='Evaluation', exact=True).click()
        expect(page.get_by_role('heading', level=1)).to_have_text('Know what the results mean')
        checked('View URL identifies evaluation', 'view=evaluation' in page.url)
        checked('Page title identifies active view', page.title().startswith('Evaluation'))
        page.go_back(wait_until='domcontentloaded')
        expect(page.get_by_role('heading', level=1)).to_have_text('Follow the evidence.')
        checked('Browser Back restores previous view')
        page.go_forward(wait_until='domcontentloaded')
        expect(page.get_by_role('heading', level=1)).to_have_text('Know what the results mean')
        checked('Browser Forward restores active view')
        expect(page.locator('.method-grid').get_by_text('no independent clinical adjudication', exact=False)).to_be_visible()
        checked('Evaluation limitations stay visible')
        checked('Frozen scores preserved', '42.5' in page.locator('.agent-score').inner_text() and '47.5' in page.locator('.baseline-score').inner_text())
        page.locator('.evaluation-cases > summary').click()
        checked('Forty paired task outcomes are inspectable', page.locator('.case-table tbody tr').count() == 40)
        page.locator('.case-review > summary').first.click()
        checked('Developer review notes are readable', len(page.locator('.case-review').first.inner_text()) > 100)
        page.locator('.evaluation-cases > summary').click()
        page.screenshot(path=out / 'evaluation.jpg', type='jpeg', quality=60)
        scan('evaluation')

        page.get_by_role('button', name='Investigate', exact=True).click()
        page.get_by_label('Product scope').select_option('imfinzi')
        page.get_by_label('Research question', exact=True).fill('short')
        page.get_by_role('button', name='Run investigation').click()
        expect(page.locator('#question-error')).to_be_visible()
        checked('Invalid short question explains how to recover', not pending)
        page.get_by_label('Research question', exact=True).fill('Investigate Imfinzi endometrial approval and supporting trials.')
        page.screenshot(path=out / 'investigation.jpg', type='jpeg', quality=60)
        scan('investigation form')
        page.get_by_label('Research question', exact=True).press('Control+Enter')
        expect(page.locator('.loading')).to_be_visible()
        checked('Keyboard submission starts investigation')
        checked('Submitted product scope is explicit', pending[0].request.post_data_json['filters']['products'] == ['imfinzi'])
        checked('Question stays read-only while pending', page.locator('#question').get_attribute('readonly') is not None)
        checked('Product scope is disabled while pending', page.get_by_label('Product scope').is_disabled())
        checked('Navigation remains available while pending', page.get_by_role('button', name='Event feed', exact=False).is_enabled())
        pending.pop(0).fulfill(status=200, content_type='application/json', body=json.dumps(fixture))
        expect(page.locator('.brief')).to_be_visible()
        checked('Success UI renders the intercepted frozen-result fixture')
        scan('brief output fixture')
        with page.expect_download() as download:
            page.get_by_role('button', name='Export brief').click()
        download.value.save_as(out / 'fixture-brief.md')
        exported = (out / 'fixture-brief.md').read_text(encoding='utf-8')
        checked('Export retains sources and evidence limits', 'https://www.fda.gov/' in exported and '## Limits' in exported)
        page.get_by_label('Research question', exact=True).fill('A new research question that will receive a quota error.')
        page.get_by_role('button', name='Run investigation').click()
        expect(page.locator('.loading')).to_be_visible()
        pending.pop(0).fulfill(status=429, content_type='application/json', body=json.dumps({'error': 'UI QA fixture: visitor request allowance reached.'}))
        expect(page.locator('.error[role="alert"]')).to_be_visible()
        checked('Quota errors have a readable recovery state')
        checked('Previous completed brief survives a failed new request', page.locator('.brief').is_visible() and 'previous completed brief' in page.locator('.brief').inner_text().lower())
        checked('Retained output shows the original submitted question', 'Investigate Imfinzi endometrial approval' in page.locator('.brief-question').inner_text())
        page.get_by_role('button', name='Explore the event feed').click()
        checked('Error recovery returns to evidence browsing', page.locator('.events-table').is_visible())

        page.get_by_label('Product', exact=True).select_option('all')
        widths = []
        for width in [320, 390, 768, 1024, 1440]:
            page.set_viewport_size({'width': width, 'height': 844 if width < 768 else 1000})
            measurements = page.evaluate("""() => ({width:innerWidth,pageWidth:document.documentElement.scrollWidth,tableWidth:document.querySelector('.events-table').getBoundingClientRect().width,nav:[...document.querySelectorAll('nav button')].map(n=>({text:n.innerText,size:parseFloat(getComputedStyle(n).fontSize)}))})""")
            widths.append(measurements)
            checked(str(width) + 'px: no horizontal page overflow', measurements['pageWidth'] <= width)
            checked(str(width) + 'px: navigation labels remain readable', all(item['size'] >= 11 for item in measurements['nav']))
            if width == 390:
                checked('Phone records fit the available width', measurements['tableWidth'] <= width)
                page.screenshot(path=out / 'mobile.jpg', type='jpeg', quality=65)
                scan('phone feed')
        page.set_viewport_size({'width': 390, 'height': 844})
        page.locator('.event-title').first.click()
        checked('Phone drawer fits the viewport', page.get_by_role('dialog').bounding_box()['width'] <= 390)
        page.screenshot(path=out / 'mobile-evidence.jpg', type='jpeg', quality=60)
        page.keyboard.press('Escape')
        page.set_viewport_size({'width': 1440, 'height': 1000})
        page.add_style_tag(content='html {font-size:200% !important}')
        checked('Doubled text has no horizontal page overflow', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        checked('No browser JavaScript exceptions', not errors)
        browser.close()

    report = {'status': 'passed', 'url': args.url, 'scope': 'UI and accessibility checks; all investigation responses intercepted with explicit fixtures; no live inference calls', 'checks': checks, 'check_count': len(checks), 'desktop_table_top_px': before_table, 'responsive': widths, 'accessibility_scans': audits, 'browser_errors': errors}
    (out / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({'status': report['status'], 'checks': len(checks), 'table_top': before_table, 'axe_views': len(audits)}))


if __name__ == '__main__':
    main()
