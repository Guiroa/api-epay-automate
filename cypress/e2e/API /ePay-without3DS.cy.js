describe('EPAY V1 WITHOUT 3DS', () => {
    let authToken;
    let randomCode;
    let paymentMethodId;
    let apiVersion='v2';
    let env='https://api.h4b.dev/api/'
    //let env='https://api.n1co.com/api/'
    
    before(() => {
        // Leer el archivo CSV antes de ejecutar las pruebas
        cy.readFile('paraleer.csv').then((csvContent) => {
            const parseCsv = (str) => str.split('\n').map(row => row.split(','));
            // Parsear el CSV y almacenar los datos en un alias
            const rows = parseCsv(csvContent);
            const headers = rows.shift(); // Extraer los encabezados
            const data = rows.map(row => {
                let obj = {};
                row.forEach((val, index) => {
                    obj[headers[index].trim()] = val.trim(); // Asegurar que no haya espacios innecesarios
                });
                return obj;
            });
            cy.wrap(data).as('csvData'); // Guardar los datos en un alias
        });
    });
    
    beforeEach(() => {
        // Obtener token después de leer el CSV (se ejecuta antes de cada prueba)
        cy.get('@csvData').then((csvData) => {
            // Suponiendo que tomas el primer valor del CSV para la autenticación
            const row = csvData[0]; // Selecciona la fila de datos que contiene clientId y clientSecret
    
            cy.log('Realizando autenticación (getAccessToken)');
            cy.request({
                method: 'POST',
                url: env + apiVersion + '/token',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {
                    "clientId": row.clientId,
                    "clientSecret": row.clientSecret
                }
            }).then((response) => {
                // Validar la respuesta
                expect(response.status).to.eq(200);
    
                // Capturar el token de autenticación
                authToken = response.body.accessToken;
                cy.wrap(authToken).as('authToken'); // Guardar el token en un alias para su uso en las pruebas
            });
        });
    });

    it('Client API V1', function() {
        // Obtener los datos parseados del CSV
        cy.get('@csvData').then((csvData) => {
            // Iterar sobre cada fila de datos
            cy.wrap(csvData).each((row, index) => {
                cy.log(`
                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                ░████░░░░░██░░░░███░░░░░██████░░████████
                ░██░██░░░░██░░░████░░░░░██░░░░░░██░░░░██
                ░██░░██░░░██░░░████░░░░░██░░░░░░██░░░░██
                ░██░░░██░░██░░░░░██░░░░░██░░░░░░██░░░░██
                ░██░░░░██░██░░░░░██░░░░░██░░░░░░██░░░░██
                ░██░░░░░████░░░░░██░░░░░██░░░░░░██░░░░██
                ░██░░░░░░███░░░░░██░░░░░██░░░░░░██░░░░██
                ░██░░░░░░███░░████████░░██████░░████████
                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                ░█░█░█░█░ EJECUTANDO PETICIONES █░█░█░█░
                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
            `)
                const now = new Date();
                const formattedDate = now.getFullYear().toString() +
                (now.getMonth() + 1).toString().padStart(2, '0') + 
                now.getDate().toString().padStart(2, '0') + '-' +
                now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0') +
                now.getMilliseconds().toString().padStart(3, '0') +
                '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                const randomCode = 'lt-' + formattedDate;
                cy.log('OrderId:', randomCode);
                cy.log('░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Tokenizando tarjeta (paymentmethods) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░',row.carNumber);

                // Agregar tarjeta
                cy.request({
                    method: 'POST',
                    url: env+apiVersion+'/paymentmethods',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body:{
                      "customer": {
                        "id": row.customerId,
                        "name": row.name,
                        "email": row.email,
                        "phoneNumber": row.number
                      },
                      "card": {
                        "number": row.carNumber,
                        "expirationMonth": "12",
                        "expirationYear": "2029",
                        "cvv": "123",
                        "cardHolder": row.name,
                        "singleUse": false
                      }
                    }
                }).then((response) => {
                    // Validar la respuesta
                    expect(response.status).to.eq(200);
                    paymentMethodId = response.body.id;
                    cy.log('Id Tarjeta tokenizada: ', paymentMethodId);

                    // Esperar y realizar cobro
                    cy.log('░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Realizar cobro (charge) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░')
                    cy.wrap(null).then(() => {
                        cy.log('Valor de paymentMethodId antes del request:', paymentMethodId);
                        return cy.request({
                            method: 'POST',
                            url: env+apiVersion+'/charges',
                            headers: {
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json'
                            },
                            body:{
                              "order": {
                                "amount": row.amount,
                                "description": randomCode,
                                "id": randomCode,
                                "name": randomCode
                              },
                              "customerId": row.customerId,
                              "cardId": paymentMethodId,
                              "authenticationId": null,
                              "cvv": "123",
                              "billingInfo":
                                { 
                                    "countryCode": "US",
                                    "stateCode": "NC",
                                    "zipCode": "22022"
                                }
                            }
                        });
                    }).then((response) => {
                        // Validar la respuesta del cobro
                        expect(response.status).to.eq(200);
                        cy.log('Respuesta del servicio charge:', JSON.stringify(response.body, null, 2));
                    });
                });
            });
        });
    });
});