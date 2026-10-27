"""Independent checks of browser-generated PDF encryption. Synthetic data only.
Run after tests/e2e/pdf.mjs and tests/e2e/pdf-password.mjs; requires pypdf+cryptography.
"""
from pathlib import Path
from pypdf import PdfReader
from pypdf.errors import FileNotDecryptedError

root=Path(__file__).resolve().parent.parent
cases=[('tmp/pdfs/docente-aula.pdf','12345678Z','1*3**6*8Z'),
       ('tmp/pdfs/docente-estudiante.pdf','12345678Z','1*3**6*8Z'),
       ('tmp/pdfs/docente-b.pdf','87654321X','8*6**3*1X'),
       ('tmp/pdfs/orientacion-centro.pdf','11223344B','Equipo orientador'),
       ('tmp/pdfs/docente-offline.pdf','12345678Z','1*3**6*8Z'),
       ('tmp/pdfs/aula-comunidades.pdf','12345678Z','DATOS SIMULADOS'),
       ('test-results/pdf-password/orientacion.pdf','11223344B','Equipo orientador'),
       ('test-results/pdf-password/docente.pdf','12345678Z','1*3**6*8Z')]
cases += [('output/pdf/ejemplo-'+scope+'.pdf','12345678Z','DATOS SIMULADOS') for scope in ['centro','aula','estudiante']]
for name,password,mark in cases:
    reader=PdfReader(root/name)
    assert reader.is_encrypted, name
    for wrong in ['', 'incorrecta', password.lower()]:
        assert reader.decrypt(wrong)==0, name
    try:
        reader.pages[0].extract_text()
        raise AssertionError('PDF accessible without correct DNI: '+name)
    except FileNotDecryptedError:
        pass
    assert reader.decrypt(password)!=0, name
    encryption=reader.trailer['/Encrypt']
    assert encryption['/R']==6 and encryption['/V']==5 and encryption['/Length']==256
    assert encryption['/CF']['/StdCF']['/CFM']=='/AESV3'
    for page in reader.pages:
        text=page.extract_text()
        assert mark in text and password not in text, name
    assert password not in str(reader.metadata)
    assert password.encode() not in (root/name).read_bytes()
    print(name, 'OK: AES-256/R6, correct DNI required, identity retained')
print(f'{len(cases)} encrypted PDFs verified independently.')
