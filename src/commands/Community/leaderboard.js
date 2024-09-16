const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Displays a leaderboard of users based on the number of quotes.'),
    async execute(interaction) {
        try {
            // Acknowledge the interaction
            await interaction.deferReply();

            // Define file path
            const quotesFilePath = path.join(__dirname, '../../quotes.json');
            if (!fs.existsSync(quotesFilePath)) {
                return await interaction.followUp({ content: 'No quotes found.', ephemeral: true });
            }

            // Read and parse quotes
            const quotes = JSON.parse(fs.readFileSync(quotesFilePath, 'utf8'));

            // Calculate total number of quotes
            const totalQuotes = Object.values(quotes).flat().length;

            // Generate leaderboard
            const leaderboard = Object.entries(quotes)
                .map(([userId, userQuotes]) => ({ userId, count: userQuotes.length }))
                .sort((a, b) => b.count - a.count);

            if (leaderboard.length === 0) {
                return await interaction.followUp({ content: 'No quotes found.', ephemeral: true });
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Leaderboard')
                .setDescription(`Total Quotes in the Server: ${totalQuotes}\n\n` +
                    leaderboard.map((entry, index) => {
                        const member = interaction.guild.members.cache.get(entry.userId);
                        const displayName = member ? member.displayName : 'Unknown User';
                        return `**${index + 1}.** ${displayName} - ${entry.count} ${entry.count === 1 ? 'quote' : 'quotes'}`;
                    }).join('\n'))
                .setColor('#D0D0D2') // Set a color for the embed
                .setFooter({ text: 'Leaderboard of quotes in this server' })
                .setTimestamp(); // Add timestamp

            // Send the embed
            await interaction.followUp({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Error executing /leaderboard command:', error);
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
};
