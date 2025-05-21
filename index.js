    const {
      Client,
      GatewayIntentBits,
      ChannelType,
      EmbedBuilder,
      ActionRowBuilder,
      ButtonBuilder,
      ButtonStyle,
      PermissionsBitField,
    } = require('discord.js');
    const fs = require('fs');
    const path = require('path');

    const token = process.env.TOKEN;
    const prefix = '!';

    const permisosPath = path.resolve(__dirname, 'permisos.json');

    function guardarPermisos(data) {
      fs.writeFileSync(permisosPath, JSON.stringify(data, null, 2));
    }

    function cargarPermisos() {
      if (!fs.existsSync(permisosPath)) return {};
      return JSON.parse(fs.readFileSync(permisosPath));
    }

    let permisosData = cargarPermisos();

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

    client.on('messageCreate', async (message) => {
      if (message.author.bot || !message.content.startsWith(prefix)) return;

      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      if (['perms', 'prem', 'permiso'].includes(command)) {
        const msg = await message.reply('❓ ¿Quisiste decir `!perm`?');
        setTimeout(() => msg.delete().catch(() => {}), 10000);
        return;
      }

      if (command === 'ayuda') {
        const ayudaEmbed = new EmbedBuilder()
          .setTitle('📘 Comandos disponibles')
          .setColor('Blue')
          .addFields(
            { name: '!perm @usuario ver canal', value: '🔓 Da acceso al canal' },
            { name: '!perm @usuario ocultar canal', value: '🔒 Quita acceso al canal' },
            { name: '!panel @usuario canal', value: '🛠️ Panel de botones para permisos' },
            { name: '!paneladmin', value: '🔧 Muestra herramientas administrativas' },
            { name: '!addpermisos canal', value: '➕ Agrega un canal al panel persistente' },
            { name: '!permisos [@usuario]', value: '🎛️ Muestra el panel para gestionar permisos' },
            { name: '!ayuda', value: '📘 Muestra este panel de ayuda' },
          )
          .setFooter({ text: 'Bot de gestión de permisos' });

        const msg = await message.channel.send({ embeds: [ayudaEmbed] });
        setTimeout(() => msg.delete().catch(() => {}), 10000);
        return;
      }

      if (command === 'perm') {
        const user = message.mentions.users.first();
        const accion = args[1];
        const canalNombre = args.slice(2).join(' ').toLowerCase();

        if (!user || !accion || !canalNombre) {
          const msg = await message.reply(
            '❌ Uso incorrecto. Formato: `!perm @usuario ver|ocultar nombre_del_canal`',
          );
          setTimeout(() => msg.delete().catch(() => {}), 10000);
          return;
        }

        const canal = message.guild.channels.cache.find(
          (c) =>
            (c.type === ChannelType.GuildText || c.type === ChannelType.GuildVoice) &&
            c.name.toLowerCase() === canalNombre,
        );

        if (!canal) {
          const msg = await message.reply('❌ Canal no encontrado. Revisa el nombre.');
          setTimeout(() => msg.delete().catch(() => {}), 10000);
          return;
        }

        if (!canal.permissionsFor(client.user).has(PermissionsBitField.Flags.ManageChannels)) {
          const msg = await message.reply('🚫 No tengo permisos para modificar ese canal.');
          setTimeout(() => msg.delete().catch(() => {}), 10000);
          return;
        }

        let permisos = {};

        if (accion === 'ver') {
          if (canal.type === ChannelType.GuildText) {
            permisos = {
              ViewChannel: true,
              ReadMessageHistory: true,
              SendMessages: true,
            };
          } else if (canal.type === ChannelType.GuildVoice) {
            permisos = {
              ViewChannel: true,
              Connect: true,
              Speak: true,
            };
          }
        } else if (accion === 'ocultar') {
          permisos = {
            ViewChannel: false,
            SendMessages: false,
            Connect: false,
            Speak: false,
          };
        } else {
          const msg = await message.reply('❌ Acción no reconocida. Usa `ver` u `ocultar`.');
          setTimeout(() => msg.delete().catch(() => {}), 10000);
          return;
        }

        try {
          await canal.permissionOverwrites.edit(user.id, permisos);

          const resultadoEmbed = new EmbedBuilder()
            .setTitle(accion === 'ver' ? '✅ Permiso concedido' : '🚫 Permiso revocado')
            .setDescription(
              `${user.tag} ahora ${accion === 'ver' ? 'puede' : 'no puede'} acceder a <#${canal.id}>`,
            )
            .setColor(accion === 'ver' ? 'Green' : 'Red')
            .setFooter({ text: `Solicitado por ${message.author.tag}` })
            .setTimestamp();

          const msg = await message.channel.send({ embeds: [resultadoEmbed] });
          setTimeout(() => msg.delete().catch(() => {}), 10000);
        } catch (error) {
          console.error(error);
          const msg = await message.reply('❌ Error al modificar los permisos.');
          setTimeout(() => msg.delete().catch(() => {}), 10000);
        }
      }

      if (command === 'panel') {
        const user = message.mentions.users.first();
        const canalNombre = args.slice(1).join(' ').toLowerCase();

        if (!user || !canalNombre) {
          const msg = await message.reply('❌ Uso: `!panel @usuario canal`');
          setTimeout(() => msg.delete().catch(() => {}), 10000);
          return;
        }

        const canal = message.guild.channels.cache.find(
          (c) =>
            (c.type === ChannelType.GuildText || c.type === ChannelType.GuildVoice) &&
            c.name.toLowerCase() === canalNombre,
        );

        if (!canal) {
          const msg = await message.reply('❌ Canal no encontrado.');
          setTimeout(() => msg.delete().catch(() => {}), 10000);
          return;
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`ver-${user.id}-${canal.id}`)
            .setLabel('Dar acceso')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`ocultar-${user.id}-${canal.id}`)
            .setLabel('Quitar acceso')
            .setStyle(ButtonStyle.Danger),
        );

        const msg = await message.channel.send({
          content: `¿Qué acción deseas aplicar a ${user.tag} en #${canal.name}?`,
          components: [row],
        });
        setTimeout(() => msg.delete().catch(() => {}), 10000);
      }

      if (command === 'paneladmin') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          const msg = await message.reply('🚫 Solo administradores pueden usar este comando.');
          setTimeout(() => msg.delete().catch(() => {}), 10000);
          return;
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('crear-ticket')
            .setLabel('🎫 Crear ticket')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('ocultar-canal')
            .setLabel('🙈 Ocultar canal')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('mostrar-canal')
            .setLabel('👁️ Mostrar canal')
            .setStyle(ButtonStyle.Success),
        );

        const embed = new EmbedBuilder()
          .setTitle('🔧 Panel de administración')
          .setDescription('Selecciona una acción para el canal actual')
          .setColor('Blurple');

        const msg = await message.channel.send({ embeds: [embed], components: [row] });
        setTimeout(() => msg.delete().catch(() => {}), 10000);
      }

      if (command === 'addpermisos') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          const msg = await message.reply('🚫 Solo administradores pueden usar este comando.');
          setTimeout(() => msg.delete().catch(() => {}), 10000);
          return;
        }

        const canalNombre = args.join(' ').toLowerCase();
        if (!canalNombre) {
          const msg = await message.reply('❌ Debes especificar el nombre del canal a agregar.');
          setTimeout(() => msg.delete().catch(() => {}), 10000);
          return;
        }

        const canal = message.guild.channels.cache.find(
          (c) =>
            (c.type === ChannelType.GuildText || c.type === ChannelType.GuildVoice) &&
            c.name.toLowerCase() === canalNombre,
        );

        if (!canal) {
          const msg = await message.reply('❌ No encontré ese canal (texto o voz).');
          setTimeout(() => msg.delete().catch(() => {}), 10000);
          return;
        }

        if (!permisosData[message.guild.id]) {
          permisosData[message.guild.id] = [];
        }

        if (permisosData[message.guild.id].includes(canal.id)) {
          const msg = await message.reply('ℹ️ Este canal ya está agregado al panel.');
          setTimeout(() => msg.delete().catch(() => {}), 10000);
          return;
        }

        permisosData[message.guild.id].push(canal.id);
        guardarPermisos(permisosData);

        const msg = await message.channel.send(`✅ Canal ${canal.name} agregado al panel de permisos.`);
        setTimeout(() => msg.delete().catch(() => {}), 10000);
      }

      if (command === 'permisos') {
        // Muestra el panel para gestionar los canales guardados en permisos.json
        // Si se menciona usuario, muestra para ese usuario, sino para el autor
        let user = message.mentions.users.first() || message.author;
        let guildId = message.guild.id;
        let canalesGuardados = permisosData[guildId] || [];

        if (canalesGuardados.length === 0) {
          const msg = await message.reply('ℹ️ No hay canales agregados al panel aún.');
          setTimeout(() => msg.delete().catch(() => {}), 10000);
          return;
        }

        // Por cada canal agregado, genera botones para dar/quitar acceso
        const components = [];
        for (const canalId of canalesGuardados) {
          const canal = message.guild.channels.cache.get(canalId);
          if (!canal) continue;

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`ver-${user.id}-${canal.id}`)
              .setLabel(`Dar acceso a #${canal.name}`)
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`ocultar-${user.id}-${canal.id}`)
              .setLabel(`Quitar acceso a #${canal.name}`)
              .setStyle(ButtonStyle.Danger),
          );
          components.push(row);
        }

        const embed = new EmbedBuilder()
          .setTitle(`🎛️ Panel de permisos para ${user.tag}`)
          .setDescription('Usa los botones para dar o quitar acceso a los canales listados.')
          .setColor('Blue');

        const msg = await message.channel.send({ embeds: [embed], components });
        setTimeout(() => msg.delete().catch(() => {}), 10000);
      }
    });

    // Este listener es para manejar los clicks en los botones
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      const [accion, userId, canalId] = interaction.customId.split('-');
      const canal = interaction.guild.channels.cache.get(canalId);
      const user = interaction.guild.members.cache.get(userId);

      if (!canal || !user) {
        await interaction.reply({ content: '❌ Usuario o canal no válido.', ephemeral: true });
        return;
      }

      if (interaction.user.id !== interaction.message.interaction?.user.id && interaction.user.id !== interaction.guild.ownerId) {
        // Solo el usuario que pidió el panel o el dueño del servidor pueden usar los botones
        await interaction.reply({
          content: '🚫 No puedes usar este botón.',
          ephemeral: true,
        });
        return;
      }

      let permisos = {};
      if (accion === 'ver') {
        if (canal.type === ChannelType.GuildText) {
          permisos = {
            ViewChannel: true,
            ReadMessageHistory: true,
            SendMessages: true,
          };
        } else if (canal.type === ChannelType.GuildVoice) {
          permisos = {
            ViewChannel: true,
            Connect: true,
            Speak: true,
          };
        }
      } else if (accion === 'ocultar') {
        permisos = {
          ViewChannel: false,
          SendMessages: false,
          Connect: false,
          Speak: false,
        };
      } else {
        await interaction.reply({ content: '❌ Acción desconocida.', ephemeral: true });
        return;
      }

      try {
        await canal.permissionOverwrites.edit(user.id, permisos);
        await interaction.reply({
          content: `✅ Permisos actualizados: ${accion === 'ver' ? 'acceso concedido' : 'acceso revocado'} para ${user.user.tag} en #${canal.name}.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ Error al cambiar permisos.', ephemeral: true });
      }
    });

    client.login(token);
