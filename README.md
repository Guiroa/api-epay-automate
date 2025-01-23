# api-epay-automate

Este es un proyecto de pruebas automatizadas en Cypress.

# Pre-requisitos
Es necesario tener node js instalado en tu máquina  
sino lo tienes puedes descargar en el siguiente enalace https://nodejs.org  
Después de instalar node debes instalar cypress utilizando los siguientes comandos  
## npm init -y  
Este comando inicializa el proyecto y crea un archivo package.json  
## npm install cypress --save-dev
Este comando instala Cypress como dependencia de desarrollo

## Instalación

Clona el repositorio e instala las dependencias:

## Clonar repo
git clone <URL_DEL_REPOSITORIO>
## instalar dependencias
Cambiate a la carpeta api-epay-automate con el siguiente comando:  
cd api-epay-automate  
Instala dependencias con el comando:  
npm install

# Configuración del archivo csv
Llena el archivo csv con los datos de prueba, tarjeta, id, etc.
las ultimas dos columnas del csv son la llave del api generada en el portal de n1co clientId-clientSecret

# Ejecución de las pruebas
en la terminal ejecuta el siguiente comando: npx cypress open
se abrirá la siguiente pantalla:
<img width="1199" alt="Captura de pantalla 2024-11-12 a la(s) 2 17 37 p  m" src="https://github.com/user-attachments/assets/2697bf5d-0984-4435-8b7c-30d3eb5f6d26">
Escoge la opción e2e testing, en la siguiente pantalla elige el navegador en el que deseas realizar las pruebas, y da clic en el botón verde
<img width="1199" alt="Captura de pantalla 2024-11-12 a la(s) 2 18 04 p  m" src="https://github.com/user-attachments/assets/cbc998f0-3abf-4d0e-b7a1-e450093a6453">
Se te mostrarán en pantalla los archivos disponibles para ser ejecutados, debes elegir si quieres probar el api con 3ds o sin 3ds 
<img width="741" alt="Captura de pantalla 2024-11-12 a la(s) 2 25 18 p  m" src="https://github.com/user-attachments/assets/064142c0-1ab7-42dd-947c-ed4f0823c119">



# Api payments
Se a agregado un script de pruebas para el api de payments, para poder utilizarlo se agregó un segundo csv llamado dataPayments.csv en el cual hay que llenar los datos previos a lanzar la prueba los valores a configurar son los siguientes: client_id,client_secret,trids,name,card_number,expirationDate,customerId,email,phoneNumber,amount, todos deben contener valores válidos para el correcto funcionamiento del script, una vez llenos el script realiza lo siguiente:
- Lee el archivo csv y lo recorre línea por línea puede contener n líneas
- Toma el client id y client secret del csv para obtener un token de authenticación
- Con el token obtenido, lee los datos necesarios para tokenizar una tarjeta y procede a realizar la tonkenización
- Con la tarjeta tokenizada, crea la solicitud de pago (payment) obteniendo un payment id
- Con el payment id obtenido, realiza el intento de cobro (charge) para capturar los fondos, en este punto verifica si la transacción requiere o no 3ds, si la transacción no requiere 3ds, procede a capturar los fondos
- Si el payment creado requiere authenticación por 3ds, abre un iframe para authenticar 3ds, si la authenticación fue exitosa procede a capturar los fondos
## En resumen este script ejecuta los siguientes request:
- ## Authentication
- ## Tokenization
- ## Payment
- ## Charge (con y sin 3ds)
