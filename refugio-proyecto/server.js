import http from 'node:http';
//importando los datos de la bd ficticia
import datos from './database.json' with {type : "json"};
//para archivos estaticos y sus rutas
import fs from 'node:fs';
//Convertir file:///C:/ a C:\
import { fileURLToPath } from 'node:url';



//Variable auxiliar para generar los IDs
let indexId = 3;
//base de nuestra URL
const  base = "http://localhost:8080";


//Ubicacion de nuestro archivo actual
const rutaActual = import.meta.url;


http.createServer((req, res) =>{
    let body = [];
    const {method, url, headers} = req;
    const urlMascota = new URL(url, base);

    

    //1. Protocolo GET y ruta /
    if( method === 'GET' && url === '/'){
        //2.1. Obteniendo la ruta de nuestro archivo index.html
        const rutaIndex = fileURLToPath(new URL('./public/index.html', rutaActual));
        
        //1.2. Leer el archivo .html, fs.readFile()
        //1er parametro: La Ruta
        //2do parametro: El formato (utf8 para texto)
        //3er parametro: La funcion que se ejecuta al leer, parametros
        //error y data el archivo

        fs.readFile(rutaIndex, 'utf8', (err, data) => {

            //2.3. Hubo algun erro por parte del servidor al leer el archivo
            if (err) {
                res.statusCode = 500; //Error interno
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({error : "Error al cargar la pagina"}))
                return;
            }

            //Si salio bien
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(data);
            
        });
        return;
    }

    //2. Si se quiere acceder a nuestra api donde devolvemos json usamos esta validacion
    if(!headers.authorization && url.includes('/api/')){
        res.statusCode = 401;
        res.setHeader("Content-Type","application/json");
        res.end(JSON.stringify({error : "No existe autorizacion"}));
        return;
    }

    
    //3. Acceder a todas las mascotas que sean gatos y tengan 2 anios
    let mascotaEncontrada = [];
    const especie = urlMascota.searchParams.get('especie');
    const edad = parseInt(urlMascota.searchParams.get('edad'));

    if (method === 'GET' && urlMascota.pathname === "/api/mascotas") {

        mascotaEncontrada = datos.filter(mascota => {

            if (especie && edad) { //primer filtro para descartar lo demas
                return mascota.especie === especie && mascota.edad === edad // if(mascota.especie === especie  && mascota.edad === edad) { return mascota};
            }

            if (especie) {
                return mascota.especie === especie;
            }

            if (edad) {
                return mascota.edad === edad;
            }

            return true; // si no hay filtros , se devuelve todo
        });

       
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ data: mascotaEncontrada }));
    

    }


}).listen(8080, () => {console.log("Corriendo en http://localhost:8080")});