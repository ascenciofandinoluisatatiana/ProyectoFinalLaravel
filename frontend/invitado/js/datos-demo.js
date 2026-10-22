    /* ============ DATOS DEMO (en producción: GET /api/v1/propiedades) ============ */
    let SELLERS = [
      { name: 'Inmobiliaria Horizonte S.A.S.', kind: 'agency', phone: '+57 604 555 0101', email: 'contacto@horizonte.example', ini: 'IH', ver: true },
      { name: 'Capital Urbano Inmobiliaria', kind: 'agency', phone: '+57 601 555 0142', email: 'ventas@capitalurbano.example', ini: 'CU', ver: true },
      { name: 'Mariana Restrepo', kind: 'person', phone: '+57 300 555 0178', email: 'mariana.r@example.com', ini: 'MR', ver: true },
      { name: 'Andrés Pacheco', kind: 'person', phone: '+57 315 555 0199', email: 'andres.p@example.com', ini: 'AP', ver: true },
      { name: 'Casa Viva Colombia', kind: 'agency', phone: '+57 602 555 0166', email: 'info@casaviva.example', ini: 'CV', ver: true }
    ];
    let P = [
      { id: 1, type: 'casa', op: 'venta', price: 1850000000, dept: 'Antioquia', city: 'Medellín', barrio: 'El Poblado', addr: 'Cra 35 # 8A-45', lat: 6.2086, lng: -75.5659, beds: 4, baths: 4, park: 3, area: 320, estrato: 6, ver: true, prem: true, seller: 0, img: '' },
      { id: 2, type: 'apartamento', op: 'arriendo', price: 4800000, dept: 'Cundinamarca', city: 'Bogotá D.C.', barrio: 'Chapinero', addr: 'Cl 63 # 9-30', lat: 4.6533, lng: -74.0626, beds: 2, baths: 2, park: 1, area: 85, estrato: 5, ver: true, prem: true, seller: 1, img: '' },
      { id: 3, type: 'apartamento', op: 'venta', price: 980000000, dept: 'Bolívar', city: 'Cartagena', barrio: 'Bocagrande', addr: 'Av. San Martín # 7-120', lat: 10.4010, lng: -75.5560, beds: 3, baths: 3, park: 1, area: 140, estrato: 6, ver: true, prem: true, seller: 2, img: '' },
      { id: 4, type: 'finca', op: 'venta', price: 2400000000, dept: 'Antioquia', city: 'Rionegro', barrio: 'Llanogrande', addr: 'Km 4 vía Las Palmas', lat: 6.1300, lng: -75.4200, beds: 5, baths: 5, park: 6, area: 1800, estrato: 6, ver: false, prem: false, seller: 0, img: '' },
      { id: 5, type: 'apartamento', op: 'arriendo', price: 3200000, dept: 'Atlántico', city: 'Barranquilla', barrio: 'El Prado', addr: 'Cra 54 # 68-80', lat: 10.9948, lng: -74.7957, beds: 3, baths: 2, park: 1, area: 110, estrato: 5, ver: true, prem: false, seller: 3, img: '' },
      { id: 6, type: 'casa', op: 'arriendo', price: 6500000, dept: 'Valle del Cauca', city: 'Cali', barrio: 'Ciudad Jardín', addr: 'Cl 14 # 98-40', lat: 3.3500, lng: -76.5350, beds: 4, baths: 3, park: 2, area: 240, estrato: 5, ver: false, prem: false, seller: 4, img: '' },
      { id: 7, type: 'local', op: 'arriendo', price: 9000000, dept: 'Cundinamarca', city: 'Bogotá D.C.', barrio: 'Usaquén', addr: 'Cra 6 # 119-25', lat: 4.7110, lng: -74.0300, beds: 0, baths: 2, park: 2, area: 150, estrato: 5, ver: true, prem: false, seller: 1, img: '' },
      { id: 8, type: 'apartamento', op: 'venta', price: 520000000, dept: 'Santander', city: 'Bucaramanga', barrio: 'Cabecera', addr: 'Cra 33 # 52-10', lat: 7.1190, lng: -73.1100, beds: 3, baths: 2, park: 2, area: 98, estrato: 5, ver: false, prem: false, seller: 3, img: '' },
      { id: 9, type: 'lote', op: 'venta', price: 780000000, dept: 'Magdalena', city: 'Santa Marta', barrio: 'El Rodadero', addr: 'Vía al Rodadero Km 2', lat: 11.2000, lng: -74.2300, beds: 0, baths: 0, park: 0, area: 600, estrato: null, ver: false, prem: false, seller: 2, img: '' },
      { id: 10, type: 'apartamento', op: 'venta', price: 640000000, dept: 'Antioquia', city: 'Medellín', barrio: 'Laureles', addr: 'Cir. 4 # 70-15', lat: 6.2442, lng: -75.5900, beds: 3, baths: 2, park: 1, area: 105, estrato: 5, ver: true, prem: false, seller: 4, img: '' },
      { id: 11, type: 'casa', op: 'venta', price: 1450000000, dept: 'Atlántico', city: 'Barranquilla', barrio: 'Alto Prado', addr: 'Cl 79 # 56-20', lat: 11.0000, lng: -74.8100, beds: 4, baths: 4, park: 2, area: 380, estrato: 6, ver: true, prem: true, seller: 3, img: '' },
      { id: 12, type: 'apartamento', op: 'arriendo', price: 2800000, dept: 'Antioquia', city: 'Envigado', barrio: 'Zúñiga', addr: 'Cra 47 # 38 Sur-15', lat: 6.1700, lng: -75.5850, beds: 2, baths: 2, park: 1, area: 72, estrato: 4, ver: true, prem: false, seller: 0, img: '' }
    ];
