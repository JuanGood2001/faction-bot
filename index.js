const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');

const app = express();
let qrImageUrl = null;

// Servidor web para mostrar el QR como imagen
app.get('/', (req, res) => {
    if (qrImageUrl) {
        res.send(`
            <html>
            <body style="background:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0">
                <h2 style="color:white;font-family:sans-serif">Escanea con WhatsApp</h2>
                <img src="${qrImageUrl}" style="width:300px;height:300px"/>
                <p style="color:#aaa;font-family:sans-serif">Recarga la página si el QR cambió</p>
            </body>
            </html>
        `);
    } else {
        res.send('<html><body style="background:#111;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh"><h2>Esperando QR... recarga en 5 segundos</h2></body></html>');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor QR en puerto ${PORT}`));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process']
    }
});

client.on('qr', async qr => {
    qrcode.generate(qr, { small: true });
    qrImageUrl = await QRCode.toDataURL(qr);
    console.log('✅ QR listo - abre la URL de Railway en tu celular para escanearlo');
});

client.on('authenticated', () => console.log('✅ Autenticado!'));
client.on('auth_failure', msg => console.log('❌ Error:', msg));
client.on('ready', () => {
    qrImageUrl = null;
    console.log('🤖 Bot listo!');
});

// --- Estado de la faction ---
let faction = {
    nombre: "TuFaction",
    dtr: "3.0 / 4.0",
    miembros: ["Jugador1", "Jugador2", "Jugador3"],
    estado: "Segura ✅",
    balance: "$0"
};

client.on('message', async msg => {
    const body = msg.body.toLowerCase().trim();
    const args = msg.body.trim().split(' ');

    if (body === '!faction') {
        msg.reply(`⚔️ *FACTION: ${faction.nombre}*\n━━━━━━━━━━━━━━\n❤️ *DTR:* ${faction.dtr}\n🛡️ *Estado:* ${faction.estado}\n💰 *Balance:* ${faction.balance}\n👥 *Miembros (${faction.miembros.length}):*\n${faction.miembros.map(m => `  • ${m}`).join('\n')}\n━━━━━━━━━━━━━━\n_Actualiza con !dtr, !addm, !removem_`);
    }
    else if (args[0].toLowerCase() === '!dtr' && args[1]) {
        faction.dtr = args[1];
        const dtrNum = parseFloat(args[1]);
        faction.estado = dtrNum <= 0 ? "🔴 RAIDABLE" : dtrNum <= 1 ? "⚠️ PELIGRO" : "Segura ✅";
        msg.reply(`✅ DTR actualizado a *${args[1]}*\nEstado: ${faction.estado}`);
    }
    else if (args[0].toLowerCase() === '!addm' && args[1]) {
        if (!faction.miembros.includes(args[1])) { faction.miembros.push(args[1]); msg.reply(`✅ *${args[1]}* agregado.`); }
        else msg.reply(`⚠️ *${args[1]}* ya está en la faction.`);
    }
    else if (args[0].toLowerCase() === '!removem' && args[1]) {
        faction.miembros = faction.miembros.filter(m => m !== args[1]);
        msg.reply(`❌ *${args[1]}* eliminado.`);
    }
    else if (args[0].toLowerCase() === '!balance' && args[1]) {
        faction.balance = args[1];
        msg.reply(`✅ Balance: *${args[1]}*`);
    }
    else if (body === '!help') {
        msg.reply(`📋 *Comandos:*\n!faction - ver estado\n!dtr 2.5/4.0 - actualizar DTR\n!addm Jugador - agregar miembro\n!removem Jugador - quitar miembro\n!balance $500 - actualizar balance`);
    }
});

client.initialize();
