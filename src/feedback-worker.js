/* Runs after the bundled SheetJS reader and feedback-model, entirely locally. */
self.onmessage = function (event) {
  try {
    const request = event.data;
    if (!request || typeof request !== 'object' || Array.isArray(request) ||
        Object.keys(request).length !== 1 || !Object.prototype.hasOwnProperty.call(request, 'opinions')) {
      throw new Error('La solicitud de descarga no tiene un formato válido.');
    }
    const rows = PbisFeedbackModel.toSheetRows(request.opinions);
    const headers = ['ID_opinion', 'Codigo_sesion', 'Fecha', 'Rol', 'Ficha', 'Clave_aula', 'Clave_estudiante', 'Valoracion', 'Comentario', 'Version'];
    const sheet = {};
    const values = [headers].concat(rows.map(row => headers.map(header => row[header])));
    // Set each cell type explicitly. Text beginning with =, +, - or @ stays text
    // in the generated XLSX; it is never interpreted as a spreadsheet formula.
    values.forEach((row, r) => row.forEach((value, c) => {
      sheet[XLSX.utils.encode_cell({r, c})] = typeof value === 'number' ? {t: 'n', v: value} : {t: 's', v: value};
    }));
    sheet['!ref'] = XLSX.utils.encode_range({s: {r: 0, c: 0}, e: {r: values.length - 1, c: headers.length - 1}});
    sheet['!cols'] = [38, 38, 12, 15, 14, 32, 20, 12, 72, 12].map(wch => ({wch}));
    sheet['!autofilter'] = {ref: sheet['!ref']};
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Opiniones');
    book.Props = {Title: 'Opiniones sobre las fichas PBIS', Author: 'PBIS'};
    const buffer = XLSX.write(book, {type: 'array', bookType: 'xlsx', compression: true});
    self.postMessage({buffer}, [buffer]);
  } catch (error) {
    self.postMessage({error: error && typeof error.message === 'string' ? error.message : 'No se pudo preparar la hoja de opiniones.'});
  }
};
