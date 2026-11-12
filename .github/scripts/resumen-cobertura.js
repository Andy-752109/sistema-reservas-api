// Convierte coverage/coverage-summary.json en una tabla Markdown para el
// job summary de GitHub Actions. Uso: node resumen-cobertura.js >> $GITHUB_STEP_SUMMARY
const fs = require('fs');
const path = require('path');

const resumen = JSON.parse(
  fs.readFileSync(path.join('coverage', 'coverage-summary.json'), 'utf8'),
);
const metricas = ['lines', 'statements', 'functions', 'branches'];
const pct = (m) => `${m.pct.toFixed(2)} %`;

const filas = Object.entries(resumen)
  .filter(([archivo]) => archivo === 'total' || archivo.endsWith('.service.ts'))
  .map(([archivo, datos]) => {
    const nombre =
      archivo === 'total' ? '**Total**' : `\`${path.relative(process.cwd(), archivo)}\``;
    return `| ${nombre} | ${metricas.map((m) => pct(datos[m])).join(' | ')} |`;
  });

console.log('### Cobertura de pruebas unitarias\n');
console.log('| Archivo | Líneas | Sentencias | Funciones | Ramas |');
console.log('|---|---|---|---|---|');
console.log(filas.join('\n'));
console.log('\nUmbral: 70 % por servicio en las cuatro métricas (`coverageThreshold`).');
