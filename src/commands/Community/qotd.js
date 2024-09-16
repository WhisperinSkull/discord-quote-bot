const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qotd')
        .setDescription('Displays a random quote of the day.'),
    async execute(interaction) {
        try {
            // Load quotes
            const quotesFilePath = path.join(__dirname, '../../quotes.json');
            if (!fs.existsSync(quotesFilePath)) {
                return await interaction.reply({ content: 'No quotes found.', ephemeral: true });
            }
            const quotes = JSON.parse(fs.readFileSync(quotesFilePath, 'utf8'));

            // Get all quotes
            const allQuotes = Object.values(quotes).flat();
            if (allQuotes.length === 0) {
                return await interaction.reply({ content: 'No quotes available.', ephemeral: true });
            }

            // Generate a random seed based on the current date
            const today = new Date();
            const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate(); // e.g., 20240913 for September 13, 2024

            // Use the seed to pick a deterministic "random" quote for the day
            const randomIndex = seed % allQuotes.length;
            const randomQuote = allQuotes[randomIndex];

            // Get the user who the quote belongs to
            const userId = Object.keys(quotes).find(id => quotes[id].some(q => q.text === randomQuote.text));
            const guildMember = await interaction.guild.members.fetch(userId);
            const userColor = await getUserColor(userId);
            const displayName = guildMember.displayName;

            // Create embed
            const embed = new EmbedBuilder()
                .setColor(userColor)
                .setTitle('Quote of the Day')
                .setDescription(`"${randomQuote.text}"\n\n— ${displayName}\n**Date:** *${new Date(randomQuote.date).toLocaleDateString('en-US')}*`)
                .setFooter({ text: `Shared by ${displayName}`, iconURL: guildMember.user.displayAvatarURL() })
                .setTimestamp();

            // Send embed
            await interaction.reply({ embeds: [embed], ephemeral: false });

        } catch (error) {
            console.error('Error executing /qotd command:', error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
};

// Helper function to get user color
async function getUserColor(userId) {
    const colorsFilePath = path.join(__dirname, '../../colors.json');
    if (fs.existsSync(colorsFilePath)) {
        const colors = JSON.parse(fs.readFileSync(colorsFilePath, 'utf8'));
        return colors[userId] || 0x00AE86; // Default color
    }
    return 0x00AE86; // Default color
}
