describe('Payments', () => {
    let Bearer;
    let randomCode;
    let paymentMethodId;
    let paymentId;
    let chargeId;
    /// Indicar si se requiere el flujo con 3ds o sin 3ds en el campo trids true o false
    let trids=true;
    let apiVersion='v2';
    let env='https://id-payments.h4b.dev/'
    //let env='https://api.n1co.com/api/'
    
    before(() => {
        // Leer el archivo CSV antes de ejecutar las pruebas
        cy.readFile('dataPayments.csv').then((csvContent) => {
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
            
            const row = csvData[0]; // Selecciona la fila de datos que contiene clientId y clientSecret

            cy.log('Realizando autenticación (getAccessToken)');
            cy.request({
                method: 'POST',
                url: env + 'connect' + '/token',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: true, // Activa el envío como x-www-form-urlencoded
                body: {
                    client_id: row.client_id,
                    client_secret: row.client_secret,
                    grant_type: 'client_credentials'
                }
            }).then((response) => {
                // Validar la respuesta
                cy.log('Validando respuesta del token');
                expect(response.status).to.eq(200);
                //expect(response.body).to.have.property('access_token');
                //expect(response.body.access_token).to.be.a('string');
    
                // Capturar el token de autenticación
                const authToken = response.body.access_token;
                cy.wrap(authToken).as('authToken'); // Guardar el token en un alias para su uso en las pruebas
                //cy.log(`Token obtenido exitosamente: ${authToken}`);
                Bearer=authToken;
            });
        });
    });
    

    it('Payments API', () => {
        //////
        cy.log("TOKENIZANDO TARJETA")
        cy.request({
            method: 'POST',
            url: 'https://tokenization-proxy.h4b.dev/api/cards',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'tB2U4JoFW4A9LIk2hQc18hDWaibEKSrDwoS0fPlKorYyvacmzsV4Sn4egMJJ2RbZ'
            },
            body: {
                "name": "Rollffin Guiroa",
                "number": "4000000000002701",
                "expirationDate": "02/29",
                "cvv": "123",
                "brand": "Visa",
                "customerId": "IZyTLLXZy2",
                "appId": "payments",
                "enabled": true,
                "blocked": false,
                "extraNumber": "123"
            }
        }).then((response) => {
            // Validar la respuesta
            expect(response.status).to.eq(200);
            const paymentMethodId = response.body.data.id;
        
            // Persistir el valor para futuros requests
            cy.wrap(paymentMethodId).as('paymentMethodId');
            cy.log('Id Tarjeta tokenizada exitosamente: ', paymentMethodId);
        });
        
        /////
        //Creando payment
        cy.log("CREANDO PAYMENT: ")

        //Generando orderId
        const now = new Date();
                const formattedDate = now.getFullYear().toString() +
                (now.getMonth() + 1).toString().padStart(2, '0') + 
                now.getDate().toString().padStart(2, '0') + '-' +
                now.getHours().toString().padStart(2, '0') +
                now.getMinutes().toString().padStart(2, '0') +
                now.getSeconds().toString().padStart(2, '0') +
                now.getMilliseconds().toString().padStart(3, '0') +
                '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                const randomCode = 'pay-' + formattedDate;
                cy.log('OrderId:', randomCode);

        cy.request({
            method: 'POST',
            url:'https://api-payments-v3.h4b.dev/payments',
            headers:{
                'Content-Type': 'application/json',
                'Authorization':'Bearer '+Bearer
            },
            body:{
                    "customer": {
                      "id": "IZyTLLXZy2",
                      "email": "rolfin.guiroa@n1co.com",
                      "name": "Rollffin Guiroa",
                      "phoneNumber": "+50377202044",
                      "country": "SV",
                      "state": "",
                      "zipCode":"",
                      "locality": ".",
                      "registeredAt": "2022-03-24T14:23:10.9157881"
                    },
                    "description": "Orden testing",
                    "referenceId": randomCode,
                    "order": {
                      "id": randomCode,
                      "country": "SLV",
                      "category": "hugoBusiness",
                      "items": [
                        {
                          "sku": "test",
                          "name": "Gana777 50",
                          "description": "Gana777 50",
                          "quantity": 1,
                          "unitPrice": 20,
                          "price": 20,
                          "currency": "USD",
                          "category": "digital"
                        }
                      ],
                      "metadata": [
                        {
                          "name": "StoreId",
                          "value": "6657",
                          "label": "StoreId"
                        },
                        {
                          "name": "Store",
                          "value": "Gana777",
                          "label": "Store"
                        },
                        {
                          "name": "StoreEmail",
                          "value": "hugo@technocred.gt",
                          "label": "StoreEmail"
                        },
                        {
                          "name": "StoreCountry",
                          "value": "Guatemala",
                          "label": "StoreCountry"
                        },
                        {
                          "name": "StoreCategory",
                          "value": "",
                          "label": "StoreCategory"
                        },
                        {
                          "name": "StorePhone",
                          "value": "42090744",
                          "label": "StorePhone"
                        },
                        {
                          "name": "StoreAddress",
                          "value": "9 Avenida 33-34 Zona 11 Ciudad de Guatemala",
                          "label": "StoreAddress"
                        },
                        {
                          "name": "StoreCoordinates",
                          "value": "14.6072042,-90.5500043",
                          "label": "StoreCoordinates"
                        }
                      ],
                      "fees": [],
                      "discounts": [],
                      "supplier": {
                        "id": "6657",
                        "name": "Gana777",
                        "email": "hugo@technocred.gt",
                        "country": "Guatemala",
                        "phone": "42090744",
                        "address": "9 Avenida 33-34 Zona 11 Ciudad de Guatemala",
                        "coordinates": "14.6072042,-90.5500043",
                        "businessName": "TECHNOCRED, SOCIEDAD ANÓNIMA",
                        "kam": "Martin Linares",
                        "owner": "Gerardo Castillo",
                        "mcc": "7995",
                        "has3dsEnabled": trids,
                        "nit": "107937018"
                      }
                    },
                    "sendEmail": false,
                    "sendSms": false,
                    "deviceId": "",
                    "paymentInstrument": {
                      "tokenId": "a2324a22-6bdb-4524-a5e9-6ef3044dd0bf"
                    },
                    "amount": 20,
                    "currency": "USD"
                  }  

        }).then((response)=>{
            expect(response.status).to.eq(200);
            paymentId = response.body.id;
            cy.log('Payment creado exitosamente payment id: ', paymentId);
        });
///// Realizando cargo

            if (trids===true) {
                cy.log("░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ PROCESANDO COBRO CON 3DS (CYBERSOURCE)     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ")
            
            cy.get('@paymentMethodId').then((paymentMethodId) => {
                
            
                cy.request({
                    method: 'POST',
                    url: 'https://api-payments-v3.h4b.dev/charges',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + Bearer
                    },
                    body: {
                        "PaymentId": paymentId,
                        "Amount": 20.00,
                        "Currency": "USD",
                        "PaymentMethodDetails": {
                            "PaymentMethodId": paymentMethodId 
                        },
                        "RavelinDeviceId": "rjs-4c2e6830-0979-4a26-94e9-d6080246c2ea"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    chargeId = response.body.id;
                    
                    cy.log('Status:', response.status);
                            
                    cy.log('Response:', JSON.stringify(response.body, null, 2));
                    // Capturar la URL de autenticación
                   // const authUrl = response.body.authentication.url;
                   let authUrl = null;

                   if (response.body.authentication && response.body.authentication.authenticationUrl) {
                       authUrl = response.body.authentication.authenticationUrl;
                       cy.log('Authentication URL:', authUrl);
                       // Abrir la URL en el navegador
                    cy.visit(authUrl);                                                    
                    cy.wait(8000)
                    

                    //Realizando cobro
                    cy.request({
                        method: 'POST',
                    url: 'https://api-payments-v3.h4b.dev/charges',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + Bearer
                    },
                    body:{
                        "Id": chargeId
                    }

                    }).then((response)=>{
                        expect(response.status).to.eq(200);
                        if(response.body.paid===true){
                            cy.log("Cobro realizado exitosamente")
                        }
                    })

                   }


                });
            });

            } else {
            cy.log("░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ PROCESANDO COBRO SIN 3DS (SERFINSA)     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ")
            
            cy.get('@paymentMethodId').then((paymentMethodId) => {
                
            
                cy.request({
                    method: 'POST',
                    url: 'https://api-payments-v3.h4b.dev/charges',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + Bearer
                    },
                    body: {
                        "PaymentId": paymentId,
                        "Amount": 20.00,
                        "Currency": "USD",
                        "PaymentMethodDetails": {
                            "PaymentMethodId": paymentMethodId 
                        },
                        "RavelinDeviceId": "rjs-4c2e6830-0979-4a26-94e9-d6080246c2ea"
                    }
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    chargeId = response.body.id;
                    cy.log('Cargo capturado con éxito: ', chargeId);
                });
            });
            }
            
    });
            ///Termina el código
        });