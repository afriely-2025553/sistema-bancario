import { crearApp } from './app';
import { configuracion } from './config';

const app = crearApp();
const { puerto } = configuracion();

app.listen(puerto, () => {
  console.log(`API del sistema bancario académico en http://localhost:${puerto}`);
});
