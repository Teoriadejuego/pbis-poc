self.onmessage = function(event) {
  try {
    const book=XLSX.read(event.data,{type:'array',cellFormula:false,cellHTML:false,cellDates:false,sheetRows:10002});
    if(book.SheetNames.length>20) {self.postMessage({error:'El libro contiene más de 20 hojas. Prepara un archivo con las hojas necesarias.'});return;}
    let cells=0;
    const sheets=book.SheetNames.map(name=>{
      const sheet=book.Sheets[name];
      const ref=XLSX.utils.decode_range(sheet['!fullref']||sheet['!ref']||'A1');
      if(ref.e.r>10000||ref.e.c>99) return {name,unsupported:true};
      cells+=(ref.e.r+1)*(ref.e.c+1);
      if(cells>1000000) return {name,unsupported:true};
      return {name,rows:XLSX.utils.sheet_to_json(sheet,{header:1,defval:null,raw:true,blankrows:false})};
    });
    self.postMessage({sheets});
  } catch(error) {self.postMessage({error:'No se pudo leer el Excel. Comprueba que sea un Excel válido (.pbis, .xlsx o .xls), sin contraseña, y que no supere los límites del lector.'});}
};
