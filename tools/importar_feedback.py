"""Importa PBIS feedback v2, o exportaciones CSV/JSON de Formspree, sin red.

python tools/importar_feedback.py archivo.json --salida private/feedback
Solo biblioteca estándar. Cada registro se guarda una vez; un ID con contenido
distinto aborta la importación, nunca sobrescribe una valoración silenciosamente.
"""
import argparse
import csv
from contextlib import closing
import json
from pathlib import Path
import re
import sqlite3

SCHEMA = 'pbis.feedback.v2'
COLUMNS = ('schemaVersion batchId sessionCode username role preparedAt appVersion '
           'sourceSha256 sourceSheet recordId center course group studentId period '
           'feedbackType sheet indicator indicatorField indicatorLabel observedValue '
           'valueStatus scaleMin scaleMax reaction confidence rating comment '
           'nonParticipationReason opinionId').split()
TYPES = {'indicator_reaction', 'student_confidence', 'non_participation', 'interface_opinion'}


def submissions(value):
    if isinstance(value, list):
        for item in value:
            yield from submissions(item)
    elif isinstance(value, dict) and 'submissions' in value:
        yield from submissions(value['submissions'])
    elif isinstance(value, dict) and value.get('feedback_json'):
        yield json.loads(value['feedback_json'])
    elif isinstance(value, dict) and value.get('schemaVersion') == SCHEMA:
        yield value
    else:
        raise ValueError('Registro sin feedback v2. Los envíos antiguos necesitan tratamiento aparte.')


def load(path):
    with path.open(encoding='utf-8-sig', newline='') as handle:
        value = list(csv.DictReader(handle)) if path.suffix.lower() == '.csv' else json.load(handle)
    return list(submissions(value))


def validate(envelope):
    if not isinstance(envelope, dict) or envelope.get('schemaVersion') != SCHEMA:
        raise ValueError('Esquema de feedback desconocido.')
    records = envelope.get('records')
    if not isinstance(records, list) or not records:
        raise ValueError('El lote no contiene registros.')
    for record in records:
        if not isinstance(record, dict) or set(record) != set(COLUMNS):
            raise ValueError('Columnas inesperadas en un registro. No se ha importado el lote.')
        if record['schemaVersion'] != SCHEMA or record['batchId'] != envelope.get('batchId'):
            raise ValueError('Lote o versión incoherente.')
        if any(isinstance(value, (list, dict, bool)) for value in record.values()):
            raise ValueError('El registro contiene un tipo no admitido.')
        for name in ['recordId', 'batchId', 'sessionCode', 'username', 'center', 'course', 'group', 'sourceSheet', 'appVersion', 'preparedAt']:
            if not isinstance(record[name], str) or not record[name]:
                raise ValueError(f'Falta {name}.')
        if not record['recordId'].startswith(record['batchId'] + ':'):
            raise ValueError('ID de registro incoherente con su lote.')
        if not isinstance(record['sourceSha256'], str) or not re.fullmatch('[a-f0-9]{64}', record['sourceSha256']):
            raise ValueError('Huella del archivo no válida.')
        if record['feedbackType'] not in TYPES or record['role'] not in {'tutor', 'orientador'}:
            raise ValueError('Tipo de valoración o rol desconocido.')
        if record['studentId'] is not None and not isinstance(record['studentId'], str):
            raise ValueError('El ID de estudiante debe conservarse como texto.')
        if record['feedbackType'] != 'interface_opinion' and not record['studentId']:
            raise ValueError('Falta el ID del estudiante valorado.')
        yield record


def csv_value(value):
    # CSV is for spreadsheet viewing. SQLite/JSON keep exact unescaped strings.
    if isinstance(value, str) and value.lstrip().startswith(('=', '+', '-', '@')):
        return "'" + value
    return value


def import_feedback(paths, output):
    records = [r for path in paths for envelope in load(Path(path)) for r in validate(envelope)]
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    database = output / 'feedback.sqlite'
    quoted = ','.join('"' + name + '"' for name in COLUMNS)
    # No type affinity on observedValue: 0, 'No' and NULL remain different.
    definitions = ','.join('"' + name + '"' + (' TEXT PRIMARY KEY' if name == 'recordId' else '' if name == 'observedValue' else ' REAL' if name in {'scaleMin', 'scaleMax', 'confidence', 'rating'} else ' TEXT') for name in COLUMNS)
    inserted = duplicates = 0
    with closing(sqlite3.connect(database)) as db, db:
        db.execute('CREATE TABLE IF NOT EXISTS feedback (' + definitions + ', payload_json TEXT NOT NULL)')
        db.execute('CREATE INDEX IF NOT EXISTS feedback_student ON feedback(center, studentId, sourceSha256)')
        for record in records:
            payload = json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False)
            existing = db.execute('SELECT payload_json FROM feedback WHERE recordId=?', (record['recordId'],)).fetchone()
            if existing:
                if existing[0] != payload:
                    raise ValueError('Un recordId tiene contenidos distintos. Se ha cancelado la importación.')
                duplicates += 1
                continue
            db.execute('INSERT INTO feedback (' + quoted + ',payload_json) VALUES (' + ','.join('?' for _ in range(len(COLUMNS) + 1)) + ')', [record[name] for name in COLUMNS] + [payload])
            inserted += 1
        rows = db.execute('SELECT ' + quoted + ' FROM feedback ORDER BY preparedAt, batchId, recordId').fetchall()
    # Write after the transaction commits; never produce a partial CSV on conflict.
    temporary = output / 'feedback.csv.tmp'
    with temporary.open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.writer(handle)
        writer.writerow(COLUMNS)
        writer.writerows([csv_value(value) for value in row] for row in rows)
    temporary.replace(output / 'feedback.csv')
    return {'insertados': inserted, 'duplicados_omitidos': duplicates, 'total': len(rows), 'sqlite': str(database), 'csv': str(output / 'feedback.csv')}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archivos', nargs='+', type=Path)
    parser.add_argument('--salida', type=Path, default=Path('private/feedback'))
    args = parser.parse_args()
    try:
        print(json.dumps(import_feedback(args.archivos, args.salida), ensure_ascii=False, indent=2))
    except (ValueError, OSError, sqlite3.Error) as error:
        parser.exit(1, f'No se ha completado la importación: {error}\n')


if __name__ == '__main__':
    main()
