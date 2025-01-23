describe('Payments', () => {
    let env = 'https://id-payments.h4b.dev/';

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

    it('Procesar todas las filas del CSV', () => {
        cy.get('@csvData').then((csvData) => {
            csvData.forEach((row, index) => {
                const trids = JSON.parse(row.trids);

                cy.log(`Procesando fila ${index + 1}:`);
                cy.log(JSON.stringify(row, null, 2));
                //cy.log('Procesando fila:', JSON.stringify(row));
                //cy.log(`Procesando fila ${index + 1}:`, JSON.stringify(row));
                // Realizar autenticación
                cy.request({
                    method: 'POST',
                    url: env + 'connect/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    form: true,
                    body: {
                        client_id: row.client_id,
                        client_secret: row.client_secret,
                        grant_type: 'client_credentials'
                    }
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    const Bearer = response.body.access_token;

                    // TOKENIZAR TARJETA
                    cy.log('TOKENIZANDO TARJETA');
                    cy.request({
                        method: 'POST',
                        url: 'https://tokenization-proxy.h4b.dev/api/cards',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': 'tB2U4JoFW4A9LIk2hQc18hDWaibEKSrDwoS0fPlKorYyvacmzsV4Sn4egMJJ2RbZ'
                        },
                        body: {
                            "name": row.name,
                            "number": row.card_number,
                            "expirationDate": row.expirationDate,
                            "cvv": "123",
                            "brand": "Visa",
                            "customerId": row.customerId,
                            "appId": "payments",
                            "enabled": true,
                            "blocked": false,
                            "extraNumber": "123"
                        }
                    }).then((cardResponse) => {
                        expect(cardResponse.status).to.eq(200);
                        const paymentMethodId = cardResponse.body.data.id;
                        cy.log('Id Tarjeta tokenizada exitosamente: ', paymentMethodId);

                        // CREAR PAYMENT
                        cy.log('CREANDO PAYMENT');
                        const now = new Date();
                        const randomCode = `pay-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

                        cy.request({
                            method: 'POST',
                            url: 'https://api-payments-v3.h4b.dev/payments',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${Bearer}`
                            },
                            body: {
                                "customer": {
                                    "id": row.customerId,
                                    "email": row.email,
                                    "name": row.name,
                                    "phoneNumber": row.phoneNumber,
                                    "country": "SV",
                                    "state": "",
                                    "zipCode": "",
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
                                            "unitPrice": row.amount,
                                            "price": row.amount,
                                            "currency": "USD",
                                            "category": "digital"
                                        }
                                    ],
                                    "metadata": [
                                        { "name": "StoreId", "value": "6657", "label": "StoreId" },
                                        { "name": "Store", "value": "Gana777", "label": "Store" },
                                        { "name": "StoreEmail", "value": "hugo@technocred.gt", "label": "StoreEmail" },
                                        { "name": "StoreCountry", "value": "Guatemala", "label": "StoreCountry" },
                                        { "name": "StoreCategory", "value": "", "label": "StoreCategory" },
                                        { "name": "StorePhone", "value": "42090744", "label": "StorePhone" },
                                        { "name": "StoreAddress", "value": "9 Avenida 33-34 Zona 11 Ciudad de Guatemala", "label": "StoreAddress" },
                                        { "name": "StoreCoordinates", "value": "14.6072042,-90.5500043", "label": "StoreCoordinates" }
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
                                "paymentInstrument": { "tokenId": paymentMethodId },
                                "amount": row.amount,
                                "currency": "USD"
                            }
                        }).then((paymentResponse) => {
                            expect(paymentResponse.status).to.eq(200);
                            const paymentId = paymentResponse.body.id;
                            cy.log('Payment creado exitosamente:', paymentId);

                            // REALIZAR CARGO
                            const chargeRequest = {
                                method: 'POST',
                                url: 'https://api-payments-v3.h4b.dev/charges',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${Bearer}`
                                },
                                body: {
                                    "PaymentId": paymentId,
                                    "Amount": row.amount,
                                    "Currency": "USD",
                                    "PaymentMethodDetails": { "PaymentMethodId": paymentMethodId },
                                    "RavelinDeviceId": "rjs-4c2e6830-0979-4a26-94e9-d6080246c2ea"
                                }
                            };

                            if (trids === true) {
                                cy.log("░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ PROCESANDO COBRO CON 3DS (CYBERSOURCE) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ");
                                cy.request({
                                    method: 'POST',
                                    url: 'https://api-payments-v3.h4b.dev/charges',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${Bearer}`
                                    },
                                    body: {
                                        "PaymentId": paymentId,
                                        "Amount": row.amount,
                                        "Currency": "USD",
                                        "PaymentMethodDetails": { "PaymentMethodId": paymentMethodId },
                                        "RavelinDeviceId": "rjs-4c2e6830-0979-4a26-94e9-d6080246c2ea"
                                    }
                                }).then((chargeResponse) => {
                                    expect(chargeResponse.status).to.eq(200);
                                    const chargeId = chargeResponse.body.id;
                                    cy.log('Status:', chargeResponse.status);

                                    // Capturar la URL de autenticación y procesar 3DS
                                    const authUrl = chargeResponse.body.authentication?.authenticationUrl;
                                    if (authUrl) {
                                        cy.log('Authentication URL:', authUrl);
                                        cy.visit(authUrl); // Abre la URL de autenticación
                                        cy.wait(8000); // Espera para completar la autenticación en el navegador

                                        // Confirmar cobro
                                        cy.request({
                                            method: 'POST',
                                            url: 'https://api-payments-v3.h4b.dev/charges',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${Bearer}`
                                            },
                                            body: {
                                                "Id": chargeId
                                            }
                                        }).then((confirmResponse) => {
                                            expect(confirmResponse.status).to.eq(200);
                                            if (confirmResponse.body.paid === true) {
                                                cy.log("░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Cobro con 3DS realizado exitosamente ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░");
                                            }
                                        });
                                    } else {
                                        cy.log('No se encontró URL de autenticación para 3DS.');
                                    }
                                });
                            } else {
                                cy.log("░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ PROCESANDO COBRO SIN 3DS (SERFINSA) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ");                                cy.request(chargeRequest).then((chargeResponse) => {
                                    expect(chargeResponse.status).to.eq(200);
                                    cy.log('░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Cobro sin 3DS realizado exitosamente ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░');
                                });
                            }
                        });
                    });
                });
            });
        });
    });
});