process.on('unhandledRejection', console.error);  // Captura errores no manejados

const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const express = require('express');
const app = express();

const token = process.env.TOKEN;
const prefix = '!';  // Define tu prefijo aquí

// Configura el bot de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

// Comandos del bot
client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'perm') {
    const user = message.mentions.users.first();
    const accion = args[1];
    const canalNombre = args.slice(2).join(' ').toLowerCase();

    if (!user || !accion || !canalNombre) {
      return message.reply('❌ Uso incorrecto. Formato: `!perm @usuario ver nombre_del_canal`');
    }

    const canal = message.guild.channels.cache.find(
      (c) =>
        (c.type === ChannelType.GuildText || c.type === ChannelType.GuildVoice) &&
        c.name.toLowerCase() === canalNombre,
    );

    if (!canal) {
      console.log(`Canal no encontrado: ${canalNombre}`);
      return message.reply('❌ Canal no encontrado. Asegúrate de que el nombre esté correcto.');
    }

    if (accion === 'ver') {
      try {
        await canal.permissionOverwrites.edit(user.id, {
          ViewChannel: true,
          ReadMessageHistory: true,
          SendMessages: true,
          Connect: true,
          Speak: true,
        });

        return message.reply(`✅ ${user.tag} ahora tiene acceso completo a #${canal.name}`);
      } catch (error) {
        console.error(error);
        return message.reply('❌ Error al asignar permisos.');
      }
    } else {
      return message.reply('❌ Acción no reconocida. Solo se admite: `ver`.');
    }
  }
});

// Mantener activo con mensaje cada 10 minutos
setInterval(() => {
  console.log("🟢 Bot activo...");
}, 10 * 60 * 1000);

// Web service para Render
app.get('/', (req, res) => res.send('Bot activo.'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web activa en puerto ${PORT}`);
});

// Iniciar sesión del bot
client.login(token);




client.login(token);

client.login(token);
