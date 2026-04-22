import http from 'node:http';
//importando los datos de la bd ficticia
import datos from './database.json' with {type : "json"};
//para archivos estaticos y sus rutas
import fs from 'node:fs';
//Convertir file:///C:/ a C:\
import { fileURLToPath } from 'node:url';



//Variable auxiliar para generar los IDs
let indexId = 5;
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

    //3. Buscar a una mascota por id ==>  GET /api/mascotas/:id
    //Usando Path params y no Query Params
    const pathParts = urlMascota.pathname.split('/'); // ['', api, mascotas, id]
    //isNaN() para ver si el numero es valido 
    // incorrecto: NaN !== NaN true, parseInt('hola') ==> NaN

    if(method === 'GET' &&  pathParts.length ===  4 && pathParts[1] === 'api' && pathParts[2] === 'mascotas' && !isNaN(pathParts[3])){
        //Obteniendo idMascota
        const idMascota = parseInt(pathParts[3]);
        const mascotaEncontrada = datos.find( mascota => {
            return mascota.id === idMascota;
        })

        if(mascotaEncontrada){
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ data : mascotaEncontrada}));
        }
        else{
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({error : "No se encontro la mascota"}));
        }
    }

    
    //4. Acceder a todas las mascotas que sean gatos y tengan 2 anios
    let mascotasEncontradas = [];
    const especie = urlMascota.searchParams.get('especie');
    const edad = parseInt(urlMascota.searchParams.get('edad'));

    if (method === 'GET' && urlMascota.pathname === "/api/mascotas") {

        mascotasEncontradas = datos.filter(mascota => {

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
        res.end(JSON.stringify({ data: mascotasEncontradas }));
    

    }

    if (method === 'POST' && urlMascota.pathname === "/api/mascotas"){
       //Validamos el header, que sea json, los headers en Node vienen en minusculas
        const contentType = headers['content-type'];
        if(!contentType || !contentType.includes('application/json')){
            res.statusCode = 415;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({error: 'No se admite es formato'}));
            return;
        }
        let body = [];
        req
        .on('error', err => {
            console.log(`Existio un error en request: ${err}`);
        })
        .on('data', chunk => {
            body.push(chunk);
        })
        .on('end', () => {
            body = Buffer.concat(body).toString();
            try{
                const datosNuevaMascota = JSON.parse(body);
                datosNuevaMascota.id = indexId;
                datos.push(datosNuevaMascota);
                indexId++;
                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({mensaje : `Mascota agregada`, datosNuevaMascota}))
            }
            catch (err){
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({error : 'JSON invalido'}));

            }

        })
        return;
        
    }

    


}).listen(8080, () => {console.log("Corriendo en http://localhost:8080")});