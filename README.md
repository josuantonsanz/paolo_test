# paolo_test

Lectura bilingüe sincronizada (italiano–castellano) de los cuatro primeros capítulos
de *San Paolo della Croce* de Zoffoli.

Sitio publicado: <https://josuantonsanz.github.io/paolo_test/>

Sin dominio propio: no añadas un fichero `CNAME` ni fijes un dominio en los ajustes de
Pages, porque el repositorio se sirve en la URL por defecto de GitHub Pages.

## Aviso: contenido generado

El contenido de este repositorio se **genera automáticamente**. No editar los `.html`
ni `assets/` aquí: los cambios se sobreescriben en la siguiente publicación.

Las fuentes de verdad están en el proyecto Zoffoli:

- `scripts/sincro_assets/style.css`, `scripts/sincro_assets/app.js`
- builder: `scripts/build_html_sincro.py`

## Republicar

Desde la raíz del proyecto Zoffoli:

```bash
PYTHONIOENCODING=utf-8 ./.venv/Scripts/python.exe scripts/build_html_sincro.py
cd html_sincro
git add -A && git commit -m "rebuild" && git push
```
