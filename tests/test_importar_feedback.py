import csv
from contextlib import closing
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('feedback_import', Path(__file__).resolve().parents[1] / 'tools/importar_feedback.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FeedbackImportTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        self.addCleanup(self.directory.cleanup)
        self.record = dict.fromkeys(module.COLUMNS)
        self.record.update(schemaVersion=module.SCHEMA, batchId='batch-1', recordId='batch-1:1', sessionCode='session-1', username='tutoria1eso', role='tutor', preparedAt='2026-10-15T10:00:00Z', appVersion='0.10.12', sourceSha256='a'*64, sourceSheet='Users', center='Centro 3705', course='1.º ESO', group='A', studentId='00012', feedbackType='indicator_reaction', sheet='roster', indicator='bullying_peers', indicatorField='bullying_companeros_n', indicatorLabel='Menciones', observedValue=0, valueStatus='observed', reaction='ok')

    def envelope(self, record=None):
        return {'schemaVersion': module.SCHEMA, 'batchId': 'batch-1', 'records': [record or self.record]}

    def write(self, name, value):
        path = self.root / name
        path.write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
        return path

    def test_exact_ids_zero_duplicate_and_formspree_json(self):
        path = self.write('formspree.json', {'submissions': [{'feedback_json': json.dumps(self.envelope())}]})
        first = module.import_feedback([path], self.root / 'out')
        second = module.import_feedback([path], self.root / 'out')
        self.assertEqual(first['insertados'], 1)
        self.assertEqual(second['duplicados_omitidos'], 1)
        with closing(sqlite3.connect(first['sqlite'])) as db:
            self.assertEqual(db.execute('SELECT studentId, observedValue, typeof(observedValue) FROM feedback').fetchone(), ('00012', 0, 'integer'))

    def test_csv_export_and_formula_like_comments(self):
        self.record['comment'] = '=1+1\nTexto, con "comillas"'
        path = self.root / 'formspree.csv'
        with path.open('w', encoding='utf-8-sig', newline='') as handle:
            writer = csv.DictWriter(handle, fieldnames=['feedback_json'])
            writer.writeheader()
            writer.writerow({'feedback_json': json.dumps(self.envelope())})
        result = module.import_feedback([path], self.root / 'out')
        with closing(sqlite3.connect(result['sqlite'])) as db:
            self.assertEqual(db.execute('SELECT comment FROM feedback').fetchone()[0], self.record['comment'])
        with Path(result['csv']).open(encoding='utf-8-sig', newline='') as handle:
            self.assertEqual(next(csv.DictReader(handle))['comment'], "'" + self.record['comment'])

    def test_conflicting_id_rolls_back_new_rows_and_keeps_csv(self):
        initial = self.write('first.json', self.envelope())
        result = module.import_feedback([initial], self.root / 'out')
        prior_csv = Path(result['csv']).read_bytes()
        changed = {**self.record, 'reaction': 'review'}
        new = {**self.record, 'recordId': 'batch-1:2', 'center': 'Centro 3884'}
        conflict = self.write('conflict.json', {**self.envelope(), 'records': [new, changed]})
        with self.assertRaisesRegex(ValueError, 'contenidos distintos'):
            module.import_feedback([conflict], self.root / 'out')
        with closing(sqlite3.connect(result['sqlite'])) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM feedback').fetchone()[0], 1)
        self.assertEqual(Path(result['csv']).read_bytes(), prior_csv)

    def test_old_or_extra_data_is_not_silently_imported(self):
        old = self.write('old.json', {'message': 'legacy only'})
        with self.assertRaisesRegex(ValueError, 'sin feedback v2'):
            module.import_feedback([old], self.root / 'out')
        extra = self.write('extra.json', self.envelope({**self.record, 'name': 'not allowed'}))
        with self.assertRaisesRegex(ValueError, 'Columnas inesperadas'):
            module.import_feedback([extra], self.root / 'out')


if __name__ == '__main__':
    unittest.main()
