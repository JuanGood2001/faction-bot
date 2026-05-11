const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process'
        ]
    }
});

// Estado de la faction (editable con comandos)
let faction = {
    nombre: "TuFaction",
    dtr: "3.0 / 4.0",
    miembros: ["Jugador1", "Jugador2", "Jugador3"],
    estado: "Segura ✅",
    balance: "$0"
};

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('Escanea el QR con tu WhatsApp');
});

client.on('ready', () => {
    console.log('Bot listo!');
});

client.on('message', async msg => {
    const body = msg.body.toLowerCase().trim();
    const args = msg.body.trim().split(' ');

    // !faction — muestra el estado
    if (body === '!faction') {
        const info = `
⚔️ *FACTION: ${faction.nombre}*
━━━━━━━━━━━━━━
❤️ *DTR:* ${faction.dtr}
🛡️ *Estado:* ${faction.estado}
💰 *Balance:* ${faction.balance}
👥 *Miembros (${faction.miembros.length}):*
${faction.miembros.map(m => `  • ${m}`).join('\n')}
━━━━━━━━━━━━━━
_Actualiza con !dtr, !addm, !removem_
        `;
        msg.reply(info);
    }

    // !dtr 2.5/4.0 — actualiza el DTR
    else if (args[0].toLowerCase() === '!dtr' && args[1]) {
        faction.dtr = args[1];
        // detectar si está en peligro
        const dtrNum = parseFloat(args[1]);
        faction.estado = dtrNum <= 1 ? "⚠️ PELIGRO" : dtrNum <= 0 ? "🔴 RAIDABLE" : "Segura ✅";
        msg.reply(`✅ DTR actualizado a *${args[1]}*\nEstado: ${faction.estado}`);
    }

    // !addm Jugador — agrega miembro
    else if (args[0].toLowerCase() === '!addm' && args[1]) {
        const nombre = args[1];
        if (!faction.miembros.includes(nombre)) {
            faction.miembros.push(nombre);
            msg.reply(`✅ *${nombre}* agregado a la faction.`);
        } else {
            msg.reply(`⚠️ *${nombre}* ya está en la faction.`);
        }
    }

    // !removem Jugador — elimina miembro
    else if (args[0].toLowerCase() === '!removem' && args[1]) {
        const nombre = args[1];
        faction.miembros = faction.miembros.filter(m => m !== nombre);
        msg.reply(`❌ *${nombre}* eliminado de la faction.`);
    }

    // !balance $500 — actualiza el balance
    else if (args[0].toLowerCase() === '!balance' && args[1]) {
        faction.balance = args[1];
        msg.reply(`✅ Balance actualizado a *${args[1]}*`);
    }

    // !help — lista de comandos
    else if (body === '!help') {
        msg.reply(`
📋 *Comandos del bot:*
!faction — ver estado actual
!dtr 2.5/4.0 — actualizar DTR
!addm Jugador — agregar miembro
!removem Jugador — quitar miembro
!balance $500 — actualizar balance
        `);
    }
});

client.initialize();
