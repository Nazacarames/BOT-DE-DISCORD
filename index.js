const {
  Client,
  GatewayIntentBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const token = process.env.TOKEN;
const prefix = "!";

const permisosPath = path.resolve(__dirname, "permisos.json");

function guardarPermisos(data) {
  try {
    fs.writeFileSync(permisosPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error guardando permisos:", e);
  }
}

function cargarPermisos() {
  if (!fs.existsSync(permisosPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(permisosPath));
  } catch {
    return {};
  }
}

let permisosData = cargarPermisos();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Comando para corregir comandos mal escritos
  if (["perms", "prem", "permiso"].includes(command)) {
    const msg = await message.reply("❓ ¿Quisiste decir `!perm`?");
    setTimeout(() => msg.delete().catch(() => {}), 10000);
    return;
  }

  if (command === "ayuda") {
    const ayudaEmbed = new EmbedBuilder()
      .setTitle("📘 Comandos disponibles")
      .setColor("Blue")
      .addFields(
        { name: "!perm @usuario ver canal", value: "🔓 Da acceso al canal" },
        {
          name: "!perm @usuario ocultar canal",
          value: "🔒 Quita acceso al canal",
        },
        {
          name: "!panel @usuario canal",
          value: "🛠️ Panel de botones para permisos",
        },
        {
          name: "!paneladmin",
          value: "🔧 Muestra herramientas administrativas",
        },
        {
          name: "!addpermisos canal",
          value: "➕ Agrega un canal al panel persistente",
        },
        {
          name: "!permisos [@usuario]",
          value: "🎛️ Muestra el panel para gestionar permisos",
        },
        { name: "!ayuda", value: "📘 Muestra este panel de ayuda" },
      )
      .setFooter({ text: "Bot de gestión de permisos" });
    await message.channel.send({ embeds: [ayudaEmbed] });
    return;
  }

  if (command === "perm") {
    if (args.length < 3) {
      const msg = await message.reply(
        "❌ Uso incorrecto. Formato: `!perm @usuario ver|ocultar nombre_del_canal`",
      );
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }
    const user = message.mentions.users.first();
    if (!user) {
      const msg = await message.reply("❌ Debes mencionar un usuario válido.");
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }
    const accion = args[1].toLowerCase();
    const canalNombre = args.slice(2).join(" ").toLowerCase();

    const canal = message.guild.channels.cache.find(
      (c) =>
        (c.type === ChannelType.GuildText ||
          c.type === ChannelType.GuildVoice) &&
        c.name.toLowerCase() === canalNombre,
    );

    if (!canal) {
      const msg = await message.reply(
        "❌ Canal no encontrado. Revisa el nombre.",
      );
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }

    if (
      !canal
        .permissionsFor(client.user)
        .has(PermissionsBitField.Flags.ManageChannels)
    ) {
      const msg = await message.reply(
        "🚫 No tengo permisos para modificar ese canal.",
      );
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }

    let permisos = {};
    if (accion === "ver") {
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
    } else if (accion === "ocultar") {
      permisos = {
        ViewChannel: false,
        SendMessages: false,
        Connect: false,
        Speak: false,
      };
    } else {
      const msg = await message.reply(
        "❌ Acción no reconocida. Usa `ver` u `ocultar`.",
      );
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }

    try {
      await canal.permissionOverwrites.edit(user.id, permisos);
      const resultadoEmbed = new EmbedBuilder()
        .setTitle(
          accion === "ver" ? "✅ Permiso concedido" : "🚫 Permiso revocado",
        )
        .setDescription(
          `${user.tag} ahora ${accion === "ver" ? "puede" : "no puede"} acceder a <#${canal.id}>`,
        )
        .setColor(accion === "ver" ? "Green" : "Red")
        .setFooter({ text: `Solicitado por ${message.author.tag}` })
        .setTimestamp();
      await message.channel.send({ embeds: [resultadoEmbed] });
    } catch (error) {
      console.error(error);
      const msg = await message.reply("❌ Error al modificar los permisos.");
      setTimeout(() => msg.delete().catch(() => {}), 10000);
    }
  }

  if (command === "panel") {
    if (args.length < 2) {
      const msg = await message.reply("❌ Uso: `!panel @usuario canal`");
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }
    const user = message.mentions.users.first();
    if (!user) {
      const msg = await message.reply("❌ Debes mencionar un usuario válido.");
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }
    const canalNombre = args.slice(1).join(" ").toLowerCase();

    const canal = message.guild.channels.cache.find(
      (c) =>
        (c.type === ChannelType.GuildText ||
          c.type === ChannelType.GuildVoice) &&
        c.name.toLowerCase() === canalNombre,
    );

    if (!canal) {
      const msg = await message.reply("❌ Canal no encontrado.");
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ver-${user.id}-${canal.id}`)
        .setLabel("Dar acceso")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`ocultar-${user.id}-${canal.id}`)
        .setLabel("Quitar acceso")
        .setStyle(ButtonStyle.Danger),
    );

    await message.channel.send({
      content: `¿Qué acción deseas aplicar a ${user.tag} en #${canal.name}?`,
      components: [row],
    });
  }

  if (command === "paneladmin") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      const msg = await message.reply(
        "🚫 Solo administradores pueden usar este comando.",
      );
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("crear-ticket")
        .setLabel("🎫 Crear ticket")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("ocultar-canal")
        .setLabel("🙈 Ocultar canal")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("mostrar-canal")
        .setLabel("👁️ Mostrar canal")
        .setStyle(ButtonStyle.Success),
    );

    const embed = new EmbedBuilder()
      .setTitle("🔧 Panel de administración")
      .setDescription("Selecciona una acción para el canal actual")
      .setColor("Blurple");

    await message.channel.send({ embeds: [embed], components: [row] });
  }

  if (command === "addpermisos") {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      const msg = await message.reply(
        "🚫 Solo administradores pueden usar este comando.",
      );
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }

    const canalNombre = args.join(" ").toLowerCase();
    if (!canalNombre) {
      const msg = await message.reply(
        "❌ Debes especificar el nombre del canal a agregar.",
      );
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }

    const canal = message.guild.channels.cache.find(
      (c) =>
        (c.type === ChannelType.GuildText ||
          c.type === ChannelType.GuildVoice) &&
        c.name.toLowerCase() === canalNombre,
    );

    if (!canal) {
      const msg = await message.reply("❌ Canal no encontrado.");
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }

    if (!permisosData[message.guild.id]) permisosData[message.guild.id] = {};
    permisosData[message.guild.id][canal.id] = canal.name;

    guardarPermisos(permisosData);

    await message.channel.send(
      `✅ Canal **${canal.name}** agregado al panel de permisos.`,
    );
  }

  if (command === "permisos") {
    // Si no hay canal, usamos el canal actual para mostrar botones de canales guardados
    const user = message.mentions.users.first() || message.author;
    const guildPermisos = permisosData[message.guild.id];
    if (!guildPermisos || Object.keys(guildPermisos).length === 0) {
      await message.channel.send(
        "❌ No hay canales agregados al panel. Usa `!addpermisos nombre_del_canal`",
      );
      return;
    }

    const rows = [];
    let row = new ActionRowBuilder();

    let count = 0;
    for (const [canalId, canalName] of Object.entries(guildPermisos)) {
      if (count > 4) {
        rows.push(row);
        row = new ActionRowBuilder();
        count = 0;
      }

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`ver-${user.id}-${canalId}`)
          .setLabel(`Dar acceso a ${canalName}`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`ocultar-${user.id}-${canalId}`)
          .setLabel(`Quitar acceso a ${canalName}`)
          .setStyle(ButtonStyle.Danger),
      );

      count++;
    }
    if (row.components.length > 0) rows.push(row);

    const embed = new EmbedBuilder()
      .setTitle(`🔑 Panel de permisos para ${user.tag}`)
      .setDescription(
        "Usa los botones para otorgar o quitar acceso a los canales.",
      )
      .setColor("Green");

    await message.channel.send({ embeds: [embed], components: rows });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  // Esperar que el customId sea como: ver-USERID-CANALID o ocultar-USERID-CANALID
  const [accion, userId, canalId] = interaction.customId.split("-");

  if (!["ver", "ocultar"].includes(accion)) {
    await interaction.reply({
      content: "❌ Acción inválida.",
      ephemeral: true,
    });
    return;
  }

  const guild = interaction.guild;
  const canal = guild.channels.cache.get(canalId);
  if (!canal) {
    await interaction.reply({
      content: "❌ Canal no encontrado.",
      ephemeral: true,
    });
    return;
  }

  const user = guild.members.cache.get(userId);
  if (!user) {
    await interaction.reply({
      content: "❌ Usuario no encontrado en el servidor.",
      ephemeral: true,
    });
    return;
  }

  if (
    !canal
      .permissionsFor(client.user)
      .has(PermissionsBitField.Flags.ManageChannels)
  ) {
    await interaction.reply({
      content: "🚫 No tengo permisos para modificar ese canal.",
      ephemeral: true,
    });
    return;
  }

  let permisos = {};
  if (accion === "ver") {
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
  } else if (accion === "ocultar") {
    permisos = {
      ViewChannel: false,
      SendMessages: false,
      Connect: false,
      Speak: false,
    };
  }

  try {
    await canal.permissionOverwrites.edit(user.id, permisos);

    await interaction.reply({
      content: `✅ Permisos actualizados para ${user.user.tag} en #${canal.name}.`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error modificando permisos:", error);
    await interaction.reply({
      content: "❌ Error al modificar los permisos.",
      ephemeral: true,
    });
  }
});

client.login(token);
