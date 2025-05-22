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

    if (args.length < 1) {
      const msg = await message.reply(
        "❌ Uso: `!addpermisos nombre_del_canal`",
      );
      setTimeout(() => msg.delete().catch(() => {}), 10000);
      return;
    }

    const canalNombre = args.join(" ").toLowerCase();

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

    // Guardar canal para el panel persistente
    if (!permisosData.canales) permisosData.canales = [];
    if (!permisosData.canales.includes(canal.id)) {
      permisosData.canales.push(canal.id);
      guardarPermisos(permisosData);
      await message.channel.send(
        `✅ Canal ${canal.name} agregado al panel de permisos persistente.`,
      );
    } else {
      await message.channel.send(
        `⚠️ El canal ${canal.name} ya estaba agregado.`,
      );
    }
  }

  if (command === "permisos") {
    // Mostrar panel de canales para gestionar permisos
    let usuario = message.mentions.users.first() || message.author;

    // Si no hay canales guardados, avisar
    if (!permisosData.canales || permisosData.canales.length === 0) {
      await message.channel.send(
        "⚠️ No hay canales agregados al panel persistente. Usa `!addpermisos nombre_del_canal` para agregar.",
      );
      return;
    }

    // Crear botones para cada canal
    const botones = permisosData.canales.map((id) => {
      const canal = message.guild.channels.cache.get(id);
      if (!canal) return null;
      return new ButtonBuilder()
        .setCustomId(`toggle-${usuario.id}-${canal.id}`)
        .setLabel(canal.name)
        .setStyle(ButtonStyle.Primary);
    }).filter(Boolean);

    // Dividir botones en filas (máximo 5 por fila)
    const filas = [];
    for (let i = 0; i < botones.length; i += 5) {
      filas.push(new ActionRowBuilder().addComponents(botones.slice(i, i + 5)));
    }

    await message.channel.send({
      content: `🔧 Gestiona permisos para ${usuario.tag}. Haz clic en un canal para alternar acceso.`,
      components: filas,
    });
  }
});

// Manejo de interacciones con botones
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const [accion, userId, canalId] = interaction.customId.split("-");

  const usuario = await interaction.guild.members.fetch(userId).catch(() => null);
  const canal = interaction.guild.channels.cache.get(canalId);

  if (!usuario || !canal) {
    await interaction.reply({
      content: "❌ Usuario o canal inválido.",
      ephemeral: true,
    });
    return;
  }

  if (interaction.user.id !== userId && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({
      content: "🚫 Solo el usuario mencionado o un administrador puede usar estos botones.",
      ephemeral: true,
    });
    return;
  }

  if (accion === "ver") {
    // Dar acceso según tipo canal
    let permisos = {};
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
    try {
      await canal.permissionOverwrites.edit(usuario.id, permisos);
      await interaction.reply({
        content: `✅ Acceso concedido a ${usuario.user.tag} en ${canal.name}`,
        ephemeral: true,
      });
    } catch (e) {
      await interaction.reply({
        content: `❌ Error al otorgar permisos: ${e.message}`,
        ephemeral: true,
      });
    }
  } else if (accion === "ocultar") {
    // Quitar acceso
    try {
      await canal.permissionOverwrites.edit(usuario.id, {
        ViewChannel: false,
        SendMessages: false,
        Connect: false,
        Speak: false,
      });
      await interaction.reply({
        content: `🚫 Acceso revocado a ${usuario.user.tag} en ${canal.name}`,
        ephemeral: true,
      });
    } catch (e) {
      await interaction.reply({
        content: `❌ Error al revocar permisos: ${e.message}`,
        ephemeral: true,
      });
    }
  } else if (accion === "toggle") {
    // Toggle acceso: si tiene ViewChannel, quitar; sino dar acceso básico
    const permisosActuales = canal.permissionOverwrites.cache.get(usuario.id);
    const tieneAcceso =
      permisosActuales && permisosActuales.allow.has(PermissionsBitField.Flags.ViewChannel);

    try {
      if (tieneAcceso) {
        await canal.permissionOverwrites.edit(usuario.id, {
          ViewChannel: false,
          SendMessages: false,
          Connect: false,
          Speak: false,
        });
        await interaction.reply({
          content: `🚫 Acceso revocado a ${usuario.user.tag} en ${canal.name}`,
          ephemeral: true,
        });
      } else {
        let permisosNuevos = {};
        if (canal.type === ChannelType.GuildText) {
          permisosNuevos = {
            ViewChannel: true,
            ReadMessageHistory: true,
            SendMessages: true,
          };
        } else if (canal.type === ChannelType.GuildVoice) {
          permisosNuevos = {
            ViewChannel: true,
            Connect: true,
            Speak: true,
          };
        }
        await canal.permissionOverwrites.edit(usuario.id, permisosNuevos);
        await interaction.reply({
          content: `✅ Acceso concedido a ${usuario.user.tag} en ${canal.name}`,
          ephemeral: true,
        });
      }
    } catch (e) {
      await interaction.reply({
        content: `❌ Error al cambiar permisos: ${e.message}`,
        ephemeral: true,
      });
    }
  } else if (interaction.customId === "crear-ticket") {
    // Aquí puedes manejar el botón crear ticket (ejemplo básico)
    await interaction.reply({ content: "🎫 Función de crear ticket aún no implementada.", ephemeral: true });
  } else if (interaction.customId === "ocultar-canal") {
    // Ocultar canal para @everyone
    try {
      await canal.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        ViewChannel: false,
      });
      await interaction.reply({
        content: `🙈 Canal ${canal.name} ocultado para todos.`,
        ephemeral: true,
      });
    } catch (e) {
      await interaction.reply({ content: `❌ Error: ${e.message}`, ephemeral: true });
    }
  } else if (interaction.customId === "mostrar-canal") {
    // Mostrar canal para @everyone
    try {
      await canal.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        ViewChannel: true,
      });
      await interaction.reply({
        content: `👁️ Canal ${canal.name} mostrado para todos.`,
        ephemeral: true,
      });
    } catch (e) {
      await interaction.reply({ content: `❌ Error: ${e.message}`, ephemeral: true });
    }
  } else {
    await interaction.reply({
      content: "❌ Acción no reconocida.",
      ephemeral: true,
    });
  }
});

client.login(token);

