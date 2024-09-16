const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addmulti')
        .setDescription('Add a quote involving multiple users.')
        .addStringOption(option =>
            option.setName('quote')
                .setDescription('The full quote text, with each user’s part separated by a "|" character.')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user1')
                .setDescription('The first user involved in the quote.')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user2')
                .setDescription('The second user involved in the quote.')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user3')
                .setDescription('The third user involved in the quote (optional).')
                .setRequired(false))
        .addUserOption(option =>
            option.setName('user4')
                .setDescription('The fourth user involved in the quote (optional).')
                .setRequired(false)),
    async execute(interaction) {
        const quote = interaction.options.getString('quote');
        const users = [
            interaction.options.getUser('user1'),
            interaction.options.getUser('user2'),
            interaction.options.getUser('user3'),
            interaction.options.getUser('user4')
        ].filter(user => user !== null); // Remove nulls for optional users

        const guildMembers = await Promise.all(users.map(user => interaction.guild.members.fetch(user.id)));
        const userDisplayNames = guildMembers.map(member => member.displayName);
        const quotedUserIds = users.map(user => user.id);

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US');

        // Load or create quotes.json file safely
        const quotesFilePath = path.join(__dirname, '../../quotes.json');
        let quotes = {};

        try {
            if (fs.existsSync(quotesFilePath)) {
                const fileContent = fs.readFileSync(quotesFilePath, 'utf8');
                if (fileContent) {
                    quotes = JSON.parse(fileContent); // Only parse if the file has content
                }
            }
        } catch (err) {
            console.error('Error reading quotes.json:', err);
            return interaction.reply({ content: 'There was an error reading the quotes file. Please check the logs.', ephemeral: true });
        }

        // If the file is empty or doesn't exist, initialize it
        if (!quotes || Object.keys(quotes).length === 0) {
            quotes = {};
        }

        // Split the quote into parts if they were separated by "|"
        const quoteParts = quote.split('|');

        // Add the new quote for each user
        quotedUserIds.forEach((id, index) => {
            if (!quotes[id]) {
                quotes[id] = [];
            }
            quotes[id].push({
                text: quoteParts[index] || quoteParts[0], // If there are fewer parts than users, use the first part for everyone
                date: currentDate.toISOString(),
                participants: quotedUserIds,
                fullQuote: quote
            });
        });

        try {
            fs.writeFileSync(quotesFilePath, JSON.stringify(quotes, null, 2));
        } catch (err) {
            console.error('Error writing to quotes.json:', err);
            return interaction.reply({ content: 'There was an error saving the quote. Please check the logs.', ephemeral: true });
        }

        // Create a title string that includes both the quotes and the users
        let title = quoteParts.map((part, index) => `"${part.trim()}" - ${userDisplayNames[index]}`).join(' ');

        // Create an embed for the added quote
        const embed = new EmbedBuilder()
            .setColor(0x00AE86) // Default color
            .setTitle(title) // Updated title with quotes and users
            .setDescription(userDisplayNames.map((name, index) => `<@${quotedUserIds[index]}>: ${quoteParts[index] || quoteParts[0]}`).join('\n'))
            .setFooter({ text: `Added by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
