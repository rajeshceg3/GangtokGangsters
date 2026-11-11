#!/usr/bin/env python3
"""Verification runner for GangtokGangsters. See SKILL.md for the contract."""
import json, os, re, shutil, subprocess, sys, tempfile, time
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
CHROME = os.environ.get('CHROME_PATH', '/usr/bin/google-chrome')
failures = []

def check(name, ok, detail=''):
    print(('PASS' if ok else 'FAIL'), name, (':: ' + str(detail))[:400] if detail else '')
    if not ok:
        failures.append(name)

def main():
    import socket
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    server = subprocess.Popen([sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(1.0)
        shot = tempfile.NamedTemporaryFile(suffix='.png', delete=False).name
        proc = subprocess.run([CHROME, '--headless=new', '--no-sandbox', '--disable-gpu',
                               '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
                               '--virtual-time-budget=8000', '--window-size=1280,900',
                               '--screenshot=' + shot, '--dump-dom', 'http://127.0.0.1:%d/' % port],
                              capture_output=True, text=True, timeout=120)
        dom = proc.stdout
        check('render: app boots', '<h1>Discover Gangtok' in dom and '<h1>Discover Gangtok' in dom, dom[:200])
        errs = [l for l in proc.stderr.splitlines() if 'console' in l.lower() and 'error' in l.lower()
                and not re.search(r'dbus|gpu|vulkan|ozone|fontconfig', l, re.I)]
        check('render: no js console errors', not errs, errs[:3])

        # Guided-tour journey check (390px, real Chromium) - runs when node deps exist
        deps = os.environ.get('VERIFY_DEPS', str(Path.home() / '.verify-tour'))
        tour_js = REPO / '.cursor' / 'skills' / 'verify-gangtok-gangsters' / 'tour-journey.mjs'
        node = shutil.which('node')
        if node and (Path(deps) / 'node_modules' / 'puppeteer-core').exists():
            env = dict(os.environ, VERIFY_DEPS=deps, CHROME_PATH=CHROME)
            tproc = subprocess.run([node, str(tour_js), 'http://127.0.0.1:%d/' % port, tempfile.gettempdir()],
                                   capture_output=True, text=True, timeout=180, env=env)
            for line in tproc.stdout.splitlines():
                if line.startswith('PASS ') or line.startswith('FAIL '):
                    name = line[5:].split(' :: ')[0]
                    check('tour: ' + name, line.startswith('PASS'), line[5:].split(' :: ')[1] if ' :: ' in line[5:] else '')
            if not tproc.stdout.strip():
                check('tour: journey runner produced output', False, (tproc.stderr or '')[:400])
        else:
            print('SKIP tour journey (node or puppeteer-core missing; set VERIFY_DEPS)')
    finally:
        server.terminate()
    print('FAILURES=%d' % len(failures))
    evidence = {'repo': 'GangtokGangsters', 'ts': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'failures': failures}
    out = REPO / '.cursor' / 'skills' / 'verify-gangtok-gangsters' / 'evidence.json'
    with open(out, 'w') as f:
        json.dump(evidence, f, indent=2)
    return 1 if failures else 0

if __name__ == '__main__':
    sys.exit(main())
