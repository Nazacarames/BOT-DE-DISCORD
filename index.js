const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const { token, prefix } = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'perm') {
    const user = message.mentions.users.first();
    const accion = args[1];
    const canalNombre = args.slice(2).join(" ").toLowerCase(); // nombre en minúsculas

    if (!user || !accion || !canalNombre) {
      return message.reply('❌ Uso incorrecto. Formato: `!perm @usuario ver nombre_del_canal`');
    }

    const canal = message.guild.channels.cache.find((c) =>
      (c.type === ChannelType.GuildText || c.type === ChannelType.GuildVoice) &&
      c.name.toLowerCase() === canalNombre
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

client.login(token);


client.login(token);

client.login(token);
