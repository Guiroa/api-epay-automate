# api-epay-automate

Este es un proyecto de pruebas automatizadas en Cypress.

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
