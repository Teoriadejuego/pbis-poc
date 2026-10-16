"""Package the local application or a rebuildable project snapshot."""
import argparse
import json
from pathlib import Path
from package_files import project_files, generated_files, application_files, write_archive

def main():
    root = Path(__file__).resolve().parent.parent
    version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tipo', choices=['proyecto', 'aplicacion'], default='proyecto',
                        help='proyecto conserva fuentes; aplicacion incluye solo el visualizador local')
    parser.add_argument('--salida', type=Path)
    args = parser.parse_args()
    if args.tipo == 'aplicacion':
        files = application_files(root)
        prefix = 'PBIS'
        default_name = f'PBIS_Aplicacion_{version}.zip'
    else:
        files = {name: (root / name).read_bytes() for name in project_files(root) + generated_files(root)}
        prefix = f'PBIS_Proyecto_{version}'
        default_name = f'PBIS_Proyecto_{version}.zip'
    target = args.salida or root.parent / default_name
    count = write_archive(target, prefix, files)
    print(f'{target}: {count} archivos; integridad verificada.')

if __name__ == '__main__':
    main()
