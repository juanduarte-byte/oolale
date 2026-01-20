const http = require('http');

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/admin/login',
    method: 'HEAD'
};

const req = http.request(options, (res) => {
    console.log('--- HEADERS DEL SERVIDOR ---');
    console.log('Status:', res.statusCode);

    // Verificamos headers específicos de seguridad
    const securityHeaders = [
        'x-dns-prefetch-control',
        'x-frame-options',
        'strict-transport-security',
        'x-download-options',
        'x-content-type-options',
        'x-permitted-cross-domain-policies'
    ];

    console.log('\n--- VERIFICACIÓN DE SEGURIDAD (Helmet) ---');
    let helmetActive = false;
    securityHeaders.forEach(header => {
        if (res.headers[header]) {
            console.log(`✅ ${header}: ${res.headers[header]}`);
            helmetActive = true;
        }
    });

    if (helmetActive) {
        console.log('\n🛡️  RESULTADO: HELMET ESTÁ ACTIVO Y PROTEGIENDO');
    } else {
        console.log('\n❌ RESULTADO: No se detectaron headers de seguridad');
    }

    // Verificamos Rate Limit headers (si están expuestos)
    const rateLimitHeaders = Object.keys(res.headers).filter(h => h.includes('ratelimit'));
    if (rateLimitHeaders.length > 0) {
        console.log('\n--- VERIFICACIÓN RATE LIMIT ---');
        rateLimitHeaders.forEach(h => console.log(`✅ ${h}: ${res.headers[h]}`));
    }
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
