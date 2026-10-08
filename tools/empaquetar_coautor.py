"""Build a coauthor package from the current, reviewed build and public sources."""
import json
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
version = json.loads((root / "package.json").read_text(encoding="utf-8-sig"))["version"]
target = root.parent / f"PBIS_Para_Coautor_{version}.zip"
prefix = "PBIS/"
files = {}
for name in ["PBIS.html", "index.html"]:
    files[name] = (root / "release" / name).read_bytes()
if version not in files["PBIS.html"].decode("utf-8"):
    raise RuntimeError("Ejecuta node tools/build.mjs antes de empaquetar.")
files["EMPIEZA_AQUI.md"] = (root / "EMPIEZA_AQUI.md").read_bytes()
for name in ["datos_evaluacion.pbis", "perfiles_evaluacion.xlsx"]:
    files["DATOS_DE_PRUEBA/" + name] = (root / "site/downloads" / name).read_bytes()
# Explicit source allowlist; never walk Downloads, user uploads or generated outputs.
for folder in ["src", "tools", "data", "vendor", "site-src", "tests", "docs", "feedback-service"]:
    for source in (root / folder).rglob("*"):
        if source.name == "AUDITORIA_SIN_DATOS_LOCAL.md":
            continue
        if not source.is_file() or any(part.startswith(".") or part in {"node_modules", "__pycache__", "private"} for part in source.relative_to(root).parts):
            continue
        if source.suffix.lower() not in {".js", ".mjs", ".cjs", ".py", ".json", ".md", ".txt", ".html", ".css", ".jpg", ".png", ".svg"}:
            continue
        files["PROYECTO/" + source.relative_to(root).as_posix()] = source.read_bytes()
for name in ["package.json", "README.md", "COMPROBACIONES.md"]:
    files["PROYECTO/" + name] = (root / name).read_bytes()
for source in (root / "outputs/entrega-20260929").glob("*_evaluacion.xlsx"):
    files["PROYECTO/outputs/entrega-20260929/" + source.name] = source.read_bytes()
files["SHA256SUMS.txt"] = "".join(f"{sha256(data).hexdigest()}  {name}\n" for name, data in sorted(files.items())).encode()
with ZipFile(target, "w", ZIP_DEFLATED, compresslevel=6) as archive:
    for name, data in files.items():
        archive.writestr(prefix + name, data)
with ZipFile(target) as archive:
    assert archive.testzip() is None
    for name, expected in files.items():
        assert archive.read(prefix + name) == expected
digest = sha256(target.read_bytes()).hexdigest()
target.with_suffix(".zip.sha256").write_text(f"{digest}  {target.name}\n", encoding="utf-8")
print(f"{target}\n{len(files)} archivos verificados · SHA-256: {digest}")
