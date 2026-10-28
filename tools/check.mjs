import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const [command,args] of [
  [process.execPath,['tools/build.mjs']],
  [process.execPath,['tools/validate-data.mjs']],
  [process.execPath,['tools/run-tests.mjs']],
  [process.env.PYTHON||'python',['-m','unittest','discover','-s','tests','-p','test_*.py','-v']],
  [process.execPath,['tests/e2e/smoke.mjs']],
  [process.execPath,['tests/e2e/protected.mjs']],
  [process.execPath,['tests/e2e/usage-terms.mjs']],
  [process.execPath,['tools/verify-release.mjs']]
]){
  const result=spawnSync(command,args,{cwd:root,stdio:'inherit',shell:false});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}
