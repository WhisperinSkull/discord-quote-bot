const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('color')
        .setDescription('Set your custom color for embeds')
        .addStringOption(option =>
            option.setName('hex')
                .setDescription('Provide a hex color code (e.g., #FF5733)')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const hexColor = interaction.options.getString('hex');

        // Validate the hex color format
        const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(hexColor);
        if (!isValidHex) {
            return interaction.reply({ 
                content: 'Please provide a valid hex color code, e.g., #FF5733.', 
                ephemeral: true 
            });
        }

        // Load or create colors.json file
        const colorsFilePath = path.join(__dirname, '../../colors.json');
        let colors = {};
        if (fs.existsSync(colorsFilePath)) {
            colors = JSON.parse(fs.readFileSync(colorsFilePath, 'utf8'));
        }

        // Save the user's chosen color
        colors[userId] = hexColor;
        fs.writeFileSync(colorsFilePath, JSON.stringify(colors, null, 2));

        // Respond with confirmation
        const embed = new EmbedBuilder()
            .setColor(hexColor)
            .setTitle('Color Updated')
            .setDescription(`Your embed color has been set to ${hexColor}.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
