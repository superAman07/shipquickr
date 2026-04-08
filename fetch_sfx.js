const https = require('https');
const fs = require('fs');
https.get('https://jsapi.apiary.io/apis/sfxunifiedapi.apib', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => fs.writeFileSync('sfxapi.txt', data));
});
