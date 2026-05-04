"""Production-build browser and API checks against a local Cloudflare runtime.

Runs only from the explicitly authorized QA workflow; a public deployment is
still a separate gate. Secrets remain in ephemeral ignored runtime variables.
"""
import json
import os
import subprocess
import time
from importlib.metadata import version
from pathlib import Path
from urllib.request import urlopen

from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'reports/browser-qa';OUT.mkdir(parents=True,exist_ok=True)
URL='http://127.0.0.1:8787'
checks=[]

def checked(name,condition):
    if not condition:raise AssertionError(name)
    checks.append(name)

def start(log):
    process=subprocess.Popen(['npm','start','--','--port','8787'],cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
    for _ in range(60):
        if process.poll() is not None:raise RuntimeError('Production server exited before readiness')
        try:
            with urlopen(URL,timeout=2) as response:
                if response.status==200:return process
        except Exception:pass
        time.sleep(1)
    raise RuntimeError('Production server did not become ready')

def stop(process):
    import signal
    os.killpg(process.pid,signal.SIGTERM)
    process.wait(timeout=15)

def main():
    log=(OUT/'server.log').open('w',encoding='utf-8')
    process=None
    try:
        process=start(log)
        with sync_playwright() as p:
            browser=p.chromium.launch()
            context=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
            page=context.new_page();errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(URL,wait_until='networkidle')
            checked('Feed renders all 29 announcements',page.locator('tbody tr').count()==29)
            checked('Source-review label visible',page.get_by_text('Dated publisher field reviews',exact=True).is_visible())
            page.screenshot(path=OUT/'desktop.png',full_page=True)
            page.get_by_label('Product',exact=True).select_option('keytruda-qlex')
            checked('SC formulation filter remains distinct',page.locator('tbody tr').count()==1)
            page.get_by_role('button',name='Reset',exact=True).click()
            page.get_by_label('Approval year').select_option('2024')
            checked('Approval-year filter uses event dates',page.locator('tbody tr').count()==10)
            page.get_by_role('button',name='Reset',exact=True).click()
            opener=page.locator('.event-title').first;opener.click()
            checked('Evidence drawer and official link available',page.get_by_role('dialog').is_visible() and page.get_by_role('link',name='Read the FDA announcement').get_attribute('href').startswith('https://www.fda.gov/'))
            page.keyboard.press('Escape')
            checked('Drawer restores keyboard focus',opener.evaluate('(element)=>document.activeElement===element'))
            page.get_by_role('button',name='Evaluation',exact=True).click()
            checked('Evaluation limitations visible',page.get_by_text('no independent clinical adjudication',exact=False).is_visible())
            page.get_by_role('button',name='Event feed',exact=False).click()
            page.set_viewport_size({'width':390,'height':844})
            checked('Mobile page avoids horizontal viewport overflow',page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
            page.screenshot(path=OUT/'mobile.png',full_page=True)
            page.set_viewport_size({'width':1440,'height':1000})
            bad=context.request.post(URL+'/api/investigate',data='broken',headers={'content-type':'application/json'})
            checked('Malformed JSON rejected',bad.status==400)
            blocked=context.request.post(URL+'/api/investigate',data={'question':'Investigate Imfinzi approvals'},headers={'origin':'https://unrelated.example'})
            checked('Cross-origin request rejected',blocked.status==403)
            page.get_by_role('button',name='Start an investigation').click()
            with page.expect_response(lambda response:response.url.endswith('/api/investigate'),timeout=90000) as pending:
                page.get_by_role('button',name='Run investigation').click()
            response=pending.value;result=response.json()
            checked('Real-model browser investigation succeeds',response.status==200 and result.get('status') in ('complete','partial'))
            checked('Live answer contains both compared approval events',set(fact['id'] for fact in result['facts'])=={'fda-2024-08-15-imfinzi','fda-2024-10-03-opdivo'})
            with page.expect_download() as pending_download:
                page.get_by_role('button',name='Export brief').click()
            download=pending_download.value;download.save_as(OUT/'exported-brief.md')
            exported=(OUT/'exported-brief.md').read_text(encoding='utf-8')
            checked('Export contains sources and limitations','https://www.fda.gov/' in exported and 'independent clinical adjudication' in exported)
            checked('No browser JavaScript exceptions',not errors)
            key=os.environ['GEMINI_API_KEY']
            checked('API key absent from rendered document',key not in page.content())
            scripts=page.locator('script[src]').evaluate_all('(nodes)=>nodes.map(node=>node.src)')
            checked('API key absent from client script bundles',all(key not in context.request.get(src).text() for src in scripts))
            limited=context.request.post(URL+'/api/investigate',data={'question':'Investigate Imfinzi approvals'})
            checked('Persistent visitor quota enforced',limited.status==429)
            stop(process);process=None
            process=start(log)
            limited=context.request.post(URL+'/api/investigate',data={'question':'Investigate Imfinzi approvals'})
            checked('Quota survives runtime restart',limited.status==429)
            browser.close()
        report={'status':'passed','scope':'Local production build in GitHub Actions; not a public deployment check','playwright_version':version('playwright'),'checks':checks,'real_model':result['model'],'public_deployment_verified':False}
        (ROOT/'reports/browser-qa.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
        print(json.dumps(report))
    finally:
        if process is not None:stop(process)
        log.close()

if __name__=='__main__':main()
