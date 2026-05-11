const { Client, GatewayIntentBits } = require('discord.js');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Crear tabla si no existe
async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS faction (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `);
    // Valores por defecto si la tabla está vacía
    const defaults = {
        nombre: 'TuFaction',
        dtr: '3.0 / 4.0',
        estado: 'Segura ✅',
        balance: '$0',
        miembros: JSON.stringify(['Jugador1', 'Jugador2'])
    };
    for (const [key, value] of Object.entries(defaults)) {
        await pool.query(`
            INSERT INTO faction (key, value) VALUES ($1, $2)
            ON CONFLICT (key) DO NOTHING
        `, [key, value]);
    }
    console.log('✅ Base de datos lista');
}

async function get(key) {
    const res = await pool.query('SELECT value FROM faction WHERE key = $1', [key]);
    return res.rows[0]?.value;
}

async function set(key, value) {
    await pool.query(`
        INSERT INTO faction (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = $2
    `, [key, value]);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => console.log(`✅ Bot listo como ${client.user.tag}`));

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    const body = msg.content.toLowerCase().trim();
    const args = msg.content.trim().split(' ');

    // !faction — muestra el estado
    if (body === '!faction') {
        const nombre  = await get('nombre');
        const dtr     = await get('dtr');
        const estado  = await get('estado');
        const balance = await get('balance');
        const miembros = JSON.parse(await get('miembros'));
        msg.reply(`⚔️ **FACTION: ${nombre}**\n━━━━━━━━━━━━━━\n❤️ **DTR:** ${dtr}\n🛡️ **Estado:** ${estado}\n💰 **Balance:** ${balance}\n👥 **Miembros (${miembros.length}):**\n${miembros.map(m => `  • ${m}`).join('\n')}\n━━━━━━━━━━━━━━`);
    }

    // !update — pega el resultado de /f show y el bot lo parsea
    else if (body.startsWith('!update')) {
        const texto = msg.content.replace('!update', '').trim();
        if (!texto) return msg.reply('⚠️ Pega el resultado de `/f show` después de `!update`');

        let cambios = [];

        // Buscar DTR  (ej: "DTR: 2.50 / 4.00")
        const dtrMatch = texto.match(/DTR[:\s]+([0-9.]+\s*\/\s*[0-9.]+)/i);
        if (dtrMatch) {
            const dtrVal = dtrMatch[1].trim();
            await set('dtr', dtrVal);
            const num = parseFloat(dtrVal);
            const estado = num <= 0 ? '🔴 RAIDABLE' : num <= 1 ? '⚠️ PELIGRO' : 'Segura ✅';
            await set('estado', estado);
            cambios.push(`DTR: **${dtrVal}** (${estado})`);
        }

        // Buscar miembros (líneas con nombres de jugadores después de "Members:" o "Miembros:")
        const membersMatch = texto.match(/(?:members?|miembros?)[:\s]+([^\n]+(?:\n[^\n]+)*)/i);
        if (membersMatch) {
            const miembros = membersMatch[1]
                .split(/[\n,]+/)
                .map(m => m.replace(/\[.*?\]/g, '').trim())
                .filter(m => m.length > 1);
            if (miembros.length > 0) {
                await set('miembros', JSON.stringify(miembros));
                cambios.push(`Miembros: **${miembros.join(', ')}**`);
            }
        }

        // Buscar balance (ej: "Balance: $1234")
        const balanceMatch = texto.match(/balance[:\s]+\$?([0-9,]+)/i);
        if (balanceMatch) {
            const bal = '$' + balanceMatch[1];
            await set('balance', bal);
            cambios.push(`Balance: **${bal}**`);
        }

        // Buscar nombre de faction
        const nombreMatch = texto.match(/^([A-Za-z0-9_]+)\s*(?:faction|facci)/im);
        if (nombreMatch) {
            await set('nombre', nombreMatch[1]);
            cambios.push(`Nombre: **${nombreMatch[1]}**`);
        }

        if (cambios.length > 0) {
            msg.reply(`✅ Actualizado:\n${cambios.join('\n')}`);
        } else {
            msg.reply('⚠️ No pude leer el formato. Asegúrate de pegar el texto completo del `/f show`');
        }
    }

    // !dtr manual
    else if (args[0].toLowerCase() === '!dtr' && args[1]) {
        await set('dtr', args[1]);
        const num = parseFloat(args[1]);
        const estado = num <= 0 ? '🔴 RAIDABLE' : num <= 1 ? '⚠️ PELIGRO' : 'Segura ✅';
        await set('estado', estado);
        msg.reply(`✅ DTR: **${args[1]}** — ${estado}`);
    }

    // !addm
    else if (args[0].toLowerCase() === '!addm' && args[1]) {
        const miembros = JSON.parse(await get('miembros'));
        if (!miembros.includes(args[1])) {
            miembros.push(args[1]);
            await set('miembros', JSON.stringify(miembros));
            msg.reply(`✅ **${args[1]}** agregado.`);
        } else msg.reply(`⚠️ **${args[1]}** ya está en la faction.`);
    }

    // !removem
    else if (args[0].toLowerCase() === '!removem' && args[1]) {
        const miembros = JSON.parse(await get('miembros'));
        await set('miembros', JSON.stringify(miembros.filter(m => m !== args[1])));
        msg.reply(`❌ **${args[1]}** eliminado.`);
    }

    // !balance
    else if (args[0].toLowerCase() === '!balance' && args[1]) {
        await set('balance', args[1]);
        msg.reply(`✅ Balance: **${args[1]}**`);
    }

    // !nombre
    else if (args[0].toLowerCase() === '!nombre' && args[1]) {
        await set('nombre', args[1]);
        msg.reply(`✅ Nombre de faction: **${args[1]}**`);
    }

    // !help
    else if (body === '!help') {
        msg.reply(`📋 **Comandos:**\n\`!faction\` — ver estado\n\`!update [pega /f show]\` — actualizar todo automático\n\`!dtr 2.5/4.0\` — DTR manual\n\`!addm Jugador\` — agregar miembro\n\`!removem Jugador\` — quitar miembro\n\`!balance $500\` — balance\n\`!nombre MiFaction\` — cambiar nombre`);
    }
});

initDB().then(() => client.login(process.env.DISCORD_TOKEN));
