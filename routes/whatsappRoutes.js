const express = require('express');
const router = express.Router();

const { createWhatsAppRedirect } = require('../controller/whatsapcontroller.js');
const { validateWhatsApp } = require('../middleware/validate.js');

router.post('/whatsapp-redirect', validateWhatsApp, createWhatsAppRedirect);

router.get('/send', (req, res) => {
    res.send('GET route working');
});

router.post('/send', (req, res) => {
    console.log('POST BODY:', req.body);
    res.send('POST route working');
});

module.exports = router;  
