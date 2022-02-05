class Collect {

    async buttonCollect(message, userId, yourcard, dealercard, DECK, options) {
        let filter = async i => {
            await i.deferUpdate()
            return ["discord-blackjack-hitbtn", "discord-blackjack-splitbtn", "discord-blackjack-standbtn", "discord-blackjack-ddownbtn", "discord-blackjack-cancelbtn"].includes(i.customId) && i.user.id === userId
        }
        let result = await message.awaitMessageComponent({ filter, time: 30000 })
            .then(async i => {
                switch (i.customId) {
                    case "discord-blackjack-hitbtn": {
                        return this.hit(message, userId, yourcard, dealercard, DECK, options)
                    }
                    case "discord-blackjack-splitbtn": {
                        return this.split(message, userId, yourcard, dealercard, DECK, options)
                    }
                    case "discord-blackjack-standbtn": {
                        return this.stand(message, userId, yourcard, dealercard, DECK, options)
                    }
                    case "discord-blackjack-ddownbtn": {
                        return this.doubledown(message, userId, yourcard, dealercard, DECK, options)
                    }
                    case "discord-blackjack-cancelbtn": {
                        return this.cancel(message, userId, yourcard, dealercard, DECK, options)
                    }
                }
            })
            .catch((e) => {
                
                if (options.transition === "edit") {
                    return {
                        result: "TIMEOUT",
                        method: "None",
                        ycard: yourcard,
                        dcard: dealercard,
                        message: message
                    }
                } else if (options.transition === "delete") {
                    message.delete()
                    return {
                        result: "TIMEOUT",
                        method: "None",
                        ycard: yourcard,
                        dcard: dealercard
                    }
                }



            })

        return result
    }

    async messageCollect(message, userId, yourcard, dealercard, DECK, options, filter1) {
        if (!filter1) filter1 = ["h", "hit", "s", "stand", "cancel"]
        let filter = i => filter1.includes(i.content.toLowerCase()) && i.author.id === userId
        let result = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
            .then(async msg => {
                
                msg = msg.first()
                if (!msg) {
                    if (options.transition === "edit") {
                        return {
                            result: "TIMEOUT",
                            method: "None",
                            ycard: yourcard,
                            dcard: dealercard,
                            message: message
                        }
                    } else if (options.transition === "delete") {
                        message.delete()
                        return {
                            result: "TIMEOUT",
                            method: "None",
                            ycard: yourcard,
                            dcard: dealercard
                        }
                    }
                }
                if (msg.content.toLowerCase().startsWith("h")) {
                    return this.hit(message, userId, yourcard, dealercard, DECK, options)
                } else if (msg.content.toLowerCase() === "split" && filter1.includes("split")) {
                    return this.split(message, userId, yourcard, dealercard, DECK, options)
                } else if (msg.content.toLowerCase().startsWith("d") && filter1.includes("d")) {
                    return this.doubledown(message, userId, yourcard, dealercard, DECK, options)
                } else if (msg.content.toLowerCase().startsWith("s")) {
                    return this.stand(message, userId, yourcard, dealercard, DECK, options)
                } else if (msg.content.toLowerCase() === "cancel") {
                    return this.cancel(message, userId, yourcard, dealercard, DECK, options)
                } 
            }).catch(e => {
                if (!e.size) console.log(e)
                if (options.transition === "edit") {
                    return {
                        result: "TIMEOUT",
                        method: "None",
                        ycard: yourcard,
                        dcard: dealercard,
                        message: message
                    }
                } else if (options.transition === "delete") {
                    message.delete()
                    return {
                        result: "TIMEOUT",
                        method: "None",
                        ycard: yourcard,
                        dcard: dealercard
                    }
                }


            })

        return result
    }

    async hit(message, userId, yourcard, dealercard, DECK, options) {
        let gotCard = DECK.pop()
        let embed = options.embed
        let isSoft = false
        if (gotCard.rank === "A") {
            isSoft = true
            if (yourcard.map(c => c.rank).includes("A")) {
                gotCard.value = 1
            } else {
                gotCard.value = 10
            }
        }

        if (yourcard.map(c => c.rank).includes("A") && yourcard.find(c => c.rank === "A" && c.value === 11)) {
            isSoft = true
        }
        yourcard.push(gotCard)

        if (yourcard.map(c => c.value).reduce((a, b) => b + a) > 21 && isSoft == true) {
            isSoft = false
            for (let y = 0; y < yourcard.length; y++) {
                if (yourcard[y].rank === "A") {
                    yourcard[y].value = 1
                }
            }
        }

        if (yourcard.map(c => c.value).reduce((a, b) => b + a) >= 21) {
            if (options.isSplit === true) {
                options.isSplit = false
                return this.hit(message, userId, options.secondHand, dealercard, DECK, options)
            } else {
                return this.stand(message, userId, yourcard, dealercard, DECK, options)
            }

        }

        if (options.isSplit === true && options.secondHand) {
            embed.description = "This is the first hand."
        } else if (options.secondHand) {
            embed.description = "This is the second hand."
        } else {
            embed.description = embed.description
        }
        embed.fields[0].value = `Cards: ${yourcard.map(c => `[\`${c.emoji} ${c.rank}\`](https://google.com)`).join(" ")}\nTotal:${isSoft ? " Soft" : ""} ${yourcard.map(c => c.value).reduce((a, b) => b + a)}`
        options.embed = embed
        let components = message?.components || []
        while (components.length == 2 && components[0].components.length > 2) {
            components[0].components.pop()
        }
        if (options.transition === "edit") {
            if (options.commandType === "message") {
                message = await message.edit({ embeds: [embed], components })
            } else {
                message = await message.edit({ embeds: [embed], components })
            }
        } else {
            if (options.commandType === "message") {
                await message.delete()
                message = await message.channel.send({ embeds: [embed], components })
            } else {
                if (!message.ephemeral) {
                    await message.delete()
                }
                message = await message.channel.send({ embeds: [embed], components })
            }
        }

        return options.buttons ? this.buttonCollect(message, userId, yourcard, dealercard, DECK, options) : this.messageCollect(message, userId, yourcard, dealercard, DECK, options)
    }

    async stand(message, userId, yourcard, dealercard, DECK, options) {
        for (let z = 0; z < dealercard.length; z++) {
            if (dealercard[z].rank === "A") dealercard[z].value = 1
        }
        let yourvalue = yourcard.map(c => c.value).reduce((a, b) => b + a)
        let dealervalue = dealercard.map(d => d.rank === "A" ? 1 : d.value).reduce((a, b) => b + a)
        let finalResult = {}
        let dealerpick = Math.floor(Math.random() * 4)
        while (dealerpick > 0 && dealervalue < 21) {
            let newCard = DECK.pop()
            dealervalue += newCard.rank === "A" ? 1 : newCard.value
            dealercard.push(newCard)
            dealerpick--
        }

        for (let z = 0; z < dealercard.length; z++) {
            if (dealercard[z].rank === "A") dealercard[z].value = 1
        }

        if (yourvalue > 21) {
            finalResult = { result: "LOSE", method: "You busted", ycard: yourcard, dcard: dealercard }
        } else if (yourvalue === 21) {
            finalResult = { result: "WIN", method: "You had blackjack", ycard: yourcard, dcard: dealercard }
        } else if (yourvalue < 21 && dealervalue < yourvalue) {
            finalResult = { result: "WIN", method: "You had more", ycard: yourcard, dcard: dealercard }
        } else if (dealervalue > yourvalue && dealervalue > 21 && yourvalue < 21) {
            finalResult = { result: "WIN", method: "Dealer busted", ycard: yourcard, dcard: dealercard }
        } else if (dealervalue === 21 && yourvalue < 21) {
            finalResult = { result: "LOSE", method: "Dealer had blackjack", ycard: yourcard, dcard: dealercard }
        } else if (dealervalue > yourvalue && dealervalue < 21) {
            finalResult = { result: "LOSE", method: "Dealer had more", ycard: yourcard, dcard: dealercard }
        } else if (dealervalue === yourvalue) {
            finalResult = { result: "TIE", method: "Tie", ycard: yourcard, dcard: dealercard }
        } else if (options.isDoubleDown === true) {
            if (yourvalue > 21) {
                finalResult = { result: "DOUBLE LOSE", method: "You busted", ycard: yourcard, dcard: dealercard }
            } else if (yourvalue === 21) {
                finalResult = { result: "DOUBLE WIN", method: "You had blackjack", ycard: yourcard, dcard: dealercard }
            } else if (yourvalue < 21 && dealervalue < yourvalue) {
                finalResult = { result: "DOUBLE WIN", method: "You had more", ycard: yourcard, dcard: dealercard }
            } else if (dealervalue > yourvalue && dealervalue > 21 && yourvalue < 21) {
                finalResult = { result: "DOUBLE WIN", method: "Dealer busted", ycard: yourcard, dcard: dealercard }
            } else if (dealervalue === 21 && yourvalue < 21) {
                finalResult = { result: "DOUBLE LOSE", method: "Dealer had blackjack", ycard: yourcard, dcard: dealercard }
            } else if (dealervalue > yourvalue && dealervalue < 21) {
                finalResult = { result: "DOUBLE LOSE", method: "Dealer had more", ycard: yourcard, dcard: dealercard }
            } else if (dealervalue === yourvalue) {
                finalResult = { result: "DOUBLE TIE", method: "Tie", ycard: yourcard, dcard: dealercard }
            }
        }

        if (options.transition === "edit") {
            message = await message.edit({ embeds: message.embeds, components: [] })
            finalResult.message = message
        } else {
            await message.delete()
        }

        return finalResult
    }

    async doubledown(message, userId, yourcard, dealercard, DECK, options) {
        options.isDoubleDown = true
        let newCard = DECK.pop()
        yourcard.push(newCard)
        return this.stand(message, userId, yourcard, dealercard, DECK, options)
    }

    async split(message, userId, yourcard, dealercard, DECK, options) {
        options.isSplit = true
        let yourcard2 = [yourcard.pop()]

        if (yourcard[0].rank === "A") {
            yourcard[0].value = 10
        }

        if (yourcard2[0].rank === "A") {
            yourcard[0].value = 10
        }

        options.secondHand = yourcard2

        return this.hit(message, userId, yourcard, dealercard, DECK, options)


    }

    async cancel(message, userId, yourcard, dealercard, DECK, options) {
        if (options.transition === "edit") {
            return {
                result: "CANCEL",
                method: "None",
                ycard: yourcard,
                dcard: dealercard,
                message: message
            }
        } else {
            return {
                result: "CANCEL",
                method: "None",
                ycard: yourcard,
                dcard: dealercard
            }
        }

    }
}

module.exports = Collect