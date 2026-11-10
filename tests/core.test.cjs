const {test}=require('node:test');const assert=require('node:assert/strict');const T=require('../core.js');
test('CSV con comillas, saltos de línea, UTF-8 y campos vacíos',()=>{assert.deepEqual(T.parseCSV('\uFEFFnombre,nota\r\nAna,"uno\ndos"\r\nLuis,""\r\n'),[{nombre:'Ana',nota:'uno\ndos'},{nombre:'Luis',nota:''}]);assert.deepEqual(T.parseCSV('a;b\n1;"dos; tres"',';'),[{a:'1',b:'dos; tres'}]);});
test('CSV rechaza cabeceras repetidas y filas incorrectas',()=>{for(const input of ['a,a\n1,2','a,b\n1','a\n"sin cerrar','a\n"x"resto'])assert.throws(()=>T.parseCSV(input));});
test('Base64 UTF-8 ida y vuelta y rechazo de basura',()=>{const text='Diseño ✨ 東京';assert.equal(T.decode64(T.encode64(text)),text);assert.throws(()=>T.decode64('???'));});
test('Contraste WCAG de referencia',()=>{assert.equal(T.contrast('#000000','#ffffff').ratio,21);assert.equal(T.contrast('#123456','#123456').ratio,1);assert.throws(()=>T.contrast('red','#000000'));});
test('Texto, slug y duplicados',()=>{assert.equal(T.clean('Hola\nHola\nMundo','duplicados'),'Hola\nMundo');assert.equal(T.clean('Diseño de interfaces','slug'),'diseno-de-interfaces');});
test('SVG escapa texto y valida colores',()=>{assert.ok(!T.monogram('<>&','#123456','#ffffff').includes('<>'));assert.ok(T.gradientSVG('#000000','#FFFFFF',90).includes('linearGradient'));assert.throws(()=>T.gradientSVG('#000000','#ffffff',Infinity));});
test('Paleta devuelve cinco colores hexadecimales',()=>{for(const c of T.palette('#328877'))assert.match(c,/^#[0-9A-F]{6}$/);assert.equal(T.palette('#328877').length,5);});
test('Contraseña con tamaño solicitado y límites',()=>{assert.equal(T.password(32).length,32);assert.throws(()=>T.password(4));});
