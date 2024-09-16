const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Get a link to your quote profile page'),

    async execute(interaction) {
        const userId = interaction.user.id;  // Get the user's Discord ID
        const guild = interaction.guild;  // Get the guild (server) context

        // Get the member object from the guild
        const member = guild.members.cache.get(userId);
        const displayName = member ? member.displayName : interaction.user.username;  // Get the display name or fallback to username
        const avatarUrl = member ? member.user.displayAvatarURL({ format: 'png', size: 1024 }) : interaction.user.displayAvatarURL({ format: 'png', size: 1024 });  // Get the avatar URL

        const profileUrl = `http://127.0.0.1:3000/public/index.html?userId=${userId}&displayName=${encodeURIComponent(displayName)}&avatarUrl=${encodeURIComponent(avatarUrl)}`;  // Include userId, displayName, and avatarUrl in the URL

        // Load colors.json and get the user's color
        const colorsFilePath = path.join(__dirname, '../../colors.json');
        let userColor = 0x00AE86; // Default color
        if (fs.existsSync(colorsFilePath)) {
            const colors = JSON.parse(fs.readFileSync(colorsFilePath, 'utf8'));
            if (colors[userId]) {
                userColor = colors[userId];
            }
        }

        const embed = new EmbedBuilder()
            .setColor(userColor)  // Use the user's color here
            .setTitle(`${displayName}'s Quote Profile`)  // Use the display name here
            .setDescription(`[Click here to view your profile](${profileUrl})`)
            .setThumbnail(avatarUrl)  // Set the avatar as the thumbnail of the embed
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
