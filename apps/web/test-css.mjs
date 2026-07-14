import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import fs from 'fs';

const css = fs.readFileSync('app/globals.css', 'utf8');
postcss([tailwindcss()])
  .process(css, { from: 'app/globals.css' })
  .then(result => {
    console.log("SUCCESS length:", result.css.length);
  })
  .catch(err => {
    console.error("ERROR:", err);
  });
