import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('package_files', ROOT / 'tools/package_files.py')
pack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)

class PackagingTests(unittest.TestCase):
    def test_current_snapshot_is_rebuildable_and_contains_only_named_example_files(self):
        files = pack.project_files(ROOT)
        for name in ['package-lock.json', 'data/demo-account.json', 'data/catalog.schema.json',
                     'site-src/local-home.html', '.github/workflows/pages.yml',
                     'tests/e2e/smoke.mjs', 'feedback-service/.env.example']:
            self.assertIn(name, files)
        self.assertEqual(sorted(name for name in files if name.endswith('.xlsx')), [
            'data/examples/datos_evaluacion.xlsx', 'data/examples/llave_evaluacion.xlsx'])
        self.assertFalse(any(name.startswith('outputs/') for name in files))
        self.assertEqual(len(pack.generated_files(ROOT)), 25)

    def test_application_package_contains_one_app_and_no_source_data_or_service(self):
        files = pack.application_files(ROOT)
        self.assertEqual(set(files), {'PBIS.html', 'index.html', 'EMPIEZA-AQUI.txt',
                                      'COMPONENTES.txt', 'LICENSE-SheetJS.txt'})
        self.assertEqual(files['PBIS.html'], (ROOT / 'release/PBIS.html').read_bytes())
        self.assertEqual(files['index.html'], (ROOT / 'release/index.html').read_bytes())
        self.assertIn(b'window.PBIS_PARSER=', files['PBIS.html'])
        self.assertIn(b'new Worker(url)', files['PBIS.html'])
        self.assertIn(b'worker-src blob:', files['PBIS.html'])
        self.assertNotIn(b'<script src=', files['PBIS.html'])
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / 'application.zip'
            pack.write_archive(target, 'PBIS', files)
            with ZipFile(target) as archive:
                self.assertEqual(set(archive.namelist()), {'PBIS/' + name for name in files} | {'PBIS/SHA256SUMS_COPIA.txt'})

    def test_unrelated_data_and_private_files_do_not_enter_a_snapshot(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            required = pack.ROOT_FILES + ['data/' + name for name in pack.DATA_FILES] + [
                'feedback-service/' + name for name in pack.SERVICE_FILES]
            for name in required + ['outputs/real.xlsx', 'data/real.json', 'feedback-service/.env',
                                    'feedback-service/storage/opinions.json', 'docs/AUDITORIA_SIN_DATOS_LOCAL.md',
                                    'tests/__pycache__/test.py']:
                p = root / name
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text('test', encoding='utf-8')
            self.assertEqual(set(pack.project_files(root)), set(required))

    def test_archive_checks_integrity_and_refuses_to_replace_a_backup(self):
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / 'test.zip'
            self.assertEqual(pack.write_archive(target, 'PBIS', {'src/example.js': b'example'}), 2)
            with ZipFile(target) as archive:
                self.assertIsNone(archive.testzip())
                self.assertEqual(archive.read('PBIS/src/example.js'), b'example')
            self.assertTrue(target.with_suffix('.zip.sha256').exists())
            with self.assertRaises(FileExistsError):
                pack.write_archive(target, 'PBIS', {'changed': b'different'})

if __name__ == '__main__':
    unittest.main()
