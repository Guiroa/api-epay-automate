describe('EPAY WITH 3DS', () => {
    let authToken;
    let randomCode;
    let paymentMethodId;
    let authenticationId;
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


                    if (apiVersion ==='v1') {
                         // Esperar y realizar cobro
                    cy.log('░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Realizar cobro (Setup 3ds) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░')
                    cy.wrap(null).then(() => {
                        cy.log('Valor de paymentMethodId antes del request:', paymentMethodId);
                        return cy.request({
                            method: 'POST',
                            url: env+apiVersion+'/setup3ds',
                            headers: {
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json'
                            },
                            body:{
                              "orderInformation": {
                                "code": randomCode,
                                "currency": "USD",
                                "totalAmount": row.amount
                              },
                              "clientInformation": {
                                "address": "Some address in USA",
                                "locality": "United States",
                                "country": "US",
                                "firstName": row.name,
                                "lastName": row.name,
                                "phoneNumber": row.number,
                                "email": row.email,
                                "billState": "NC",
                                "billZip": "27244",
                                "shipToZip": null
                              },
                              "card": {
                                "cardId": paymentMethodId
                              },
                              "returnUrl": "https://webhook.site/ba8c29f7-972c-423e-a4f2-561cfaa465c5"
                            }
                        }).then((response) => {
                            // Validar la respuesta
                            //expect(response.status).to.eq(200);
                            cy.log('Response:', JSON.stringify(response.body, null, 2));
                            // Capturar la URL de autenticación
                            const authUrl = response.body.authenticationUrl;
                            cy.log('Authentication URL:', authUrl);
                            // Abrir la URL en el navegador
                            cy.visit(authUrl);                                                    
                            cy.wait(15000)

                            authenticationId = authUrl.split('authentication/')[1].split('?')[0];
                            cy.log('Authentication ID:', authenticationId);
                            cy.log('░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Realizar cobro (charge v1) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░')
                            cy.request({
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
                                  "authenticationId": authenticationId,
                                  "cvv": "123",
                                  "billingInfo":
                                  { 
                                      "countryCode": "US",
                                      "stateCode": "NC",
                                      "zipCode": "22022"
                                  }
                                }
                            }).then((response) => {
                                // Validar la respuesta
                               // expect(response.status).to.eq(200);
                                cy.log('Response:', JSON.stringify(response.body, null, 2));
                            });  

                        });
                    });
                        
                      } else {

                        cy.log('░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Realizar cobro (charge v2) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░')
                        cy.request({
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
                        }).then((response) => {
                            
                            cy.log('Status:', response.status);
                            
                            // Validar la respuesta
                            //expect(response.status).to.eq(200);
                            cy.log('Response:', JSON.stringify(response.body, null, 2));
                            // Capturar la URL de autenticación
                           // const authUrl = response.body.authentication.url;
                           let authUrl = null;
                           if (response.body.authentication && response.body.authentication.url) {
                               authUrl = response.body.authentication.url;
                               cy.log('Authentication URL:', authUrl);
                               // Abrir la URL en el navegador
                            cy.visit(authUrl);                                                    
                            cy.wait(15000)
                        
                            authenticationId = authUrl.split('authentication/')[1].split('?')[0];
                            cy.log('Authentication ID:', authenticationId);
                           }
                                          
                        
                        ///////////////
                        cy.log('░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Realizar cobro (charge) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░')
                        cy.request({
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
                              "authenticationId": authenticationId,
                              "cvv": "123",
                              "billingInfo":
                              { 
                                  "countryCode": "US",
                                  "stateCode": "NC",
                                  "zipCode": "22022"
                              }
                            }
                        }).then((response) => {
                            // Validar la respuesta
                           // expect(response.status).to.eq(200);
                            cy.log('Response:', JSON.stringify(response.body, null, 2));
                        }); 

                        });
            
                      }  
                    
                });
            });
        });
    });
});