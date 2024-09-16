const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quotes')
        .setDescription('Displays a specific user\'s quotes with pagination.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to display quotes for')
                .setRequired(true)),
    async execute(interaction) {
        try {
            const user = interaction.options.getUser('user');
            const member = await interaction.guild.members.fetch(user.id);
            const displayName = member.displayName;
            const userId = user.id;

            // Load quotes from quotes.json
            const quotesFilePath = path.join(__dirname, '../../quotes.json');
            if (!fs.existsSync(quotesFilePath)) {
                return await interaction.reply('No quotes found.');
            }
            const quotes = JSON.parse(fs.readFileSync(quotesFilePath, 'utf8'));
            const userQuotes = quotes[userId] || [];

            if (userQuotes.length === 0) {
                return await interaction.reply(`<@${userId}> has no quotes.`);
            }

            // Sort quotes by date in descending order
            userQuotes.sort((a, b) => new Date(b.date) - new Date(a.date));

            const quotesPerEmbed = 15; // Limit to 15 quotes per page
            const totalEmbeds = Math.ceil(userQuotes.length / quotesPerEmbed);

            if (totalEmbeds === 0) {
                return await interaction.reply('No quotes found for this user.');
            }

            let currentPage = 1;

            // Load colors.json and get the quoted user's color
            const colorsFilePath = path.join(__dirname, '../../colors.json');
            let quotedUserColor = 0x00AE86; // Default color
            if (fs.existsSync(colorsFilePath)) {
                const colors = JSON.parse(fs.readFileSync(colorsFilePath, 'utf8'));
                if (colors[userId]) {
                    quotedUserColor = colors[userId];
                }
            }

            const createEmbed = (page) => {
                const embed = new EmbedBuilder()
                    .setColor(quotedUserColor) // Set color from colors.json
                    .setTitle(`Quotes for ${displayName} - Page ${page} of ${totalEmbeds}`)
                    .setThumbnail(user.displayAvatarURL())
                    .setFooter({ text: 'Requested by ' + interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                const startIndex = (page - 1) * quotesPerEmbed;
                const endIndex = Math.min(startIndex + quotesPerEmbed, userQuotes.length);
                const pageQuotes = userQuotes.slice(startIndex, endIndex);

                pageQuotes.forEach(quoteObj => {
                    const quoteDate = new Date(quoteObj.date);
                    const formattedDate = quoteDate.toLocaleDateString('en-US');
                    let quoteText = quoteObj.text;

                    // Check if the quote has multiple participants
                    if (quoteObj.participants && quoteObj.participants.length > 1) {
                        // Fetch participants' names
                        const participantNames = quoteObj.participants.map(id => {
                            const member = interaction.guild.members.cache.get(id);
                            return member ? member.displayName : 'Unknown User';
                        });

                        // Display both parts of the fullQuote
                        quoteText = quoteObj.fullQuote.split('|').map((quote, index) => {
                            return `"${quote.trim()}" - ${participantNames[index] || 'Unknown User'}`;
                        }).join(' ');
                    }

                    embed.addFields({
                        name: `${quoteText}`,
                        value: `*${formattedDate}*`,
                        inline: false
                    });
                });

                return embed;
            };

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 1),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === totalEmbeds)
                );

            // Send the initial message and store the message ID
            const message = await interaction.reply({ embeds: [createEmbed(currentPage)], components: [row], fetchReply: true });

            // Adjust filter to allow any user interaction
            const filter = (i) => i.customId === 'prev' || i.customId === 'next';
            const collector = message.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                if (i.customId === 'prev') {
                    if (currentPage > 1) {
                        currentPage--;
                    }
                } else if (i.customId === 'next') {
                    if (currentPage < totalEmbeds) {
                        currentPage++;
                    }
                }

                // Update buttons
                row.components[0].setDisabled(currentPage === 1); // Disable Previous button if on first page
                row.components[1].setDisabled(currentPage === totalEmbeds); // Disable Next button if on last page

                await i.update({ embeds: [createEmbed(currentPage)], components: [row] });
            });

            collector.on('end', () => {
                message.edit({ components: [] }); // Remove buttons after the collector ends
            });

        } catch (error) {
            console.error('Error executing /quotes command:', error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
};