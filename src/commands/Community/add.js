const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a quote for a user.')
        .addStringOption(option =>
            option.setName('quote')
                .setDescription('The quote text')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user being quoted')
                .setRequired(true)),
    async execute(interaction) {
        const quote = interaction.options.getString('quote');
        const quotedUser = interaction.options.getUser('user');
        const guildMember = await interaction.guild.members.fetch(quotedUser.id);
        const quotedDisplayName = guildMember.displayName;
        const quotedUserId = quotedUser.id;

        // Get the current date in MM/DD/YYYY format
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US');

        // Load or create quotes.json file
        const quotesFilePath = path.join(__dirname, '../../quotes.json');
        let quotes = {};
        if (fs.existsSync(quotesFilePath)) {
            quotes = JSON.parse(fs.readFileSync(quotesFilePath, 'utf8'));
        }

        // Add the new quote
        if (!quotes[quotedUserId]) {
            quotes[quotedUserId] = [];
        }
        quotes[quotedUserId].push({
            text: quote,
            date: currentDate.toISOString(),
        });

        fs.writeFileSync(quotesFilePath, JSON.stringify(quotes, null, 2));

        // Load colors.json and get the quoted user's color
        const colorsFilePath = path.join(__dirname, '../../colors.json');
        let quotedUserColor = 0x00AE86; // Default color
        if (fs.existsSync(colorsFilePath)) {
            const colors = JSON.parse(fs.readFileSync(colorsFilePath, 'utf8'));
            if (colors[quotedUserId]) {
                quotedUserColor = colors[quotedUserId];
            }
        }

        // Create an embed for the added quote
        const embed = new EmbedBuilder()
            .setColor(quotedUserColor)
            .setTitle(`"${quote}"`) // Title is the quote itself
            .setDescription(`<@${quotedUserId}>\n**Date:** *${formattedDate}*`)
            .setFooter({ text: `Added by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
