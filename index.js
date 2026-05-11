const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let faction = {
    nombre: "TuFaction",
    dtr: "3.0 / 4.0",
    miembros: ["Jugador1", "Jugador2", "Jugador3"],
    estado: "Segura ✅",
    balance: "$0"
};

client.on('ready', () => {
    console.log(`✅ Bot listo como ${client.user.tag}`);
});

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    const body = msg.content.toLowerCase().trim();
    const args = msg.content.trim().split(' ');

    if (body === '!faction') {
        msg.reply(`⚔️ **FACTION: ${faction.nombre}**\n━━━━━━━━━━━━━━\n❤️ **DTR:** ${faction.dtr}\n🛡️ **Estado:** ${faction.estado}\n💰 **Balance:** ${faction.balance}\n👥 **Miembros (${faction.miembros.length}):**\n${faction.miembros.map(m => `  • ${m}`).join('\n')}\n━━━━━━━━━━━━━━\n*Actualiza con !dtr, !addm, !removem*`);
    }
    else if (args[0].toLowerCase() === '!dtr' && args[1]) {
        faction.dtr = args[1];
        const dtrNum = parseFloat(args[1]);
        faction.estado = dtrNum <= 0 ? "🔴 RAIDABLE" : dtrNum <= 1 ? "⚠️ PELIGRO" : "Segura ✅";
        msg.reply(`✅ DTR actualizado a **${args[1]}**\nEstado: ${faction.estado}`);
    }
    else if (args[0].toLowerCase() === '!addm' && args[1]) {
        if (!faction.miembros.includes(args[1])) {
            faction.miembros.push(args[1]);
            msg.reply(`✅ **${args[1]}** agregado a la faction.`);
        } else {
            msg.reply(`⚠️ **${args[1]}** ya está en la faction.`);
        }
    }
    else if (args[0].toLowerCase() === '!removem' && args[1]) {
        faction.miembros = faction.miembros.filter(m => m !== args[1]);
        msg.reply(`❌ **${args[1]}** eliminado.`);
    }
    else if (args[0].toLowerCase() === '!balance' && args[1]) {
        faction.balance = args[1];
        msg.reply(`✅ Balance actualizado a **${args[1]}**`);
    }
    else if (body === '!help') {
        msg.reply(`📋 **Comandos:**\n\`!faction\` — ver estado\n\`!dtr 2.5/4.0\` — actualizar DTR\n\`!addm Jugador\` — agregar miembro\n\`!removem Jugador\` — quitar miembro\n\`!balance $500\` — actualizar balance`);
    }
});

client.login(process.env.DISCORD_TOKEN);
