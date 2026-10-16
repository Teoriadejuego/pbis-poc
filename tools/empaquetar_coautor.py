"""Build a coauthor snapshot using the reviewed public file inventory."""
import argparse
import json
from pathlib import Path
from package_files import project_files, generated_files, write_archive

def main():
    root = Path(__file__).resolve().parent.parent
    version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--salida', type=Path, default=root.parent / f'PBIS_Para_Coautor_{version}.zip')
    args = parser.parse_args()
    generated_files(root)
    files = {'PROYECTO/' + name: (root / name).read_bytes() for name in project_files(root)}
    files.update({name: (root / 'release' / name).read_bytes() for name in ['PBIS.html', 'index.html']})
    files['EMPIEZA_AQUI.md'] = (root / 'EMPIEZA_AQUI.md').read_bytes()
    files['DATOS_DE_PRUEBA/datos_evaluacion.pbis'] = (root / 'data/examples/datos_evaluacion.xlsx').read_bytes()
    count = write_archive(args.salida, 'PBIS', files)
    print(f'{args.salida}: {count} archivos; integridad verificada.')

if __name__ == '__main__':
    main()
