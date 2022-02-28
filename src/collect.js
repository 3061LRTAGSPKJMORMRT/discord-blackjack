class Collect {

    async buttonCollect(message, userId, yourcard, dealercard, DECK, options) {
        let filter = async i => {
            await i.deferUpdate()
            return ["discord-blackjack-hitbtn", "discord-blackjack-splitbtn", "discord-blackjack-standbtn", "discord-blackjack-ddownbtn", "discord-blackjack-cancelbtn", "discord-blackjack-insbtn", "discord-blackjack-noinsbtn"].includes(i.customId) && i.user.id === userId
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
                    case "discord-blackjack-insbtn": {
                        return this.insurance(message, userId, yourcard, dealercard, DECK, options)
                    }
                    case "discord-blackjack-noinsbtn": {
                        return this.noinsurance(message, userId, yourcard, dealercard, DECK, options)
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
                } else if (msg.content.toLowerCase() === "i") {
                    return this.insurance(message, userId, yourcard, dealercard, DECK, options)
                } else if (msg.content.toLowerCase() === "ni") {
                    return this.noinsurance(message, userId, yourcard, dealercard, DECK, options)
                }
            }).catch(e => {
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
            if (yourcard.map(c => c.rank).includes("A")) {
                gotCard.value = 1
            } else {
                gotCard.value = 11
            }
        }

        yourcard.push(gotCard)

        if (yourcard.map(c => c.rank).includes("A") && yourcard.find(c => c.rank === "A" && c.value === 11)) {
            isSoft = true
        }

        if (yourcard.map(c => c.value).reduce((a, b) => b + a) > 21 && isSoft == true) {
            isSoft = false
            for (let y = 0; y < yourcard.length; y++) {
                if (yourcard[y].rank === "A") {
                    yourcard[y].value = 1
                }
            }
        }

        if (yourcard.map(c => c.value).reduce((a, b) => b + a) >= 21) {
            return this.stand(message, userId, yourcard, dealercard, DECK, options)
        }


        embed.fields[0].value = `Cards: ${yourcard.map(c => `[\`${c.emoji} ${c.rank}\`](https://google.com)`).join(" ")}\nTotal:${isSoft ? " Soft" : ""} ${yourcard.map(c => c.value).reduce((a, b) => b + a)}`
        options.embed = embed

        let components = message?.components || []
        while (components.length == 2 && components[0].components.length > 2) {
            components[0].components.pop()
        }

        if (options.isSplit === "first" && options.secondHand) {
            embed.description = "This is the first hand."
            let pv = yourcard.map(c => c.value).reduce((a, b) => b + a)
            if ((pv === 9 || pv === 10 || pv === 11) && yourcard.length == 2) {
                let embed = options.embed
                let hitbtn = { label: "Hit", style: 1, custom_id: "discord-blackjack-hitbtn", type: 2 }
                let standbtn = { label: "Stand", style: 1, custom_id: "discord-blackjack-standbtn", type: 2 }
                let ddownbtn = { label: "Double Down", style: 1, custom_id: "discord-blackjack-ddownbtn", type: 2 }
                let splitbtn = { label: "Split", style: 1, custom_id: "discord-blackjack-splitbtn", type: 2 }
                let cancelbtn = { label: "Cancel", style: 4, custom_id: "discord-blackjack-cancelbtn", type: 2 }
                let row1 = { type: 1, components: [hitbtn, standbtn, ddownbtn] }
                let row2 = { type: 1, components: [cancelbtn] }
                let components = [row1, row2]
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


        } else if (options.secondHand) {
            embed.description = "This is the second hand."
            let pv2 = yourcard.map(c => c.value).reduce((a, b) => b + a)
            if ((pv2 === 9 || pv2 === 10 || pv2 === 11) && yourcard.length == 2) {
                let embed = options.embed
                let hitbtn = { label: "Hit", style: 1, custom_id: "discord-blackjack-hitbtn", type: 2 }
                let standbtn = { label: "Stand", style: 1, custom_id: "discord-blackjack-standbtn", type: 2 }
                let ddownbtn = { label: "Double Down", style: 1, custom_id: "discord-blackjack-ddownbtn", type: 2 }
                let splitbtn = { label: "Split", style: 1, custom_id: "discord-blackjack-splitbtn", type: 2 }
                let cancelbtn = { label: "Cancel", style: 4, custom_id: "discord-blackjack-cancelbtn", type: 2 }
                let row1 = { type: 1, components: [hitbtn, standbtn, ddownbtn] }
                let row2 = { type: 1, components: [cancelbtn] }
                let components = [row1, row2]
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
        }

        else {
            embed.description = embed.description
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
        let yourvalue = yourcard.map(c => c.value).reduce((a, b) => b + a)
        let dealervalue = dealercard.map(d => d.value).reduce((a, b) => b + a)
        let finalResult = {}
        let finalResult2 = {}


        if (options.isSplit === "first") {

            options.isSplit = "second";
            let dealerrank = [dealercard[0].rank, dealercard[1].rank]
            while (dealervalue < 17) {
                let newCard = DECK.pop()
                dealercard.push(newCard)
                dealerrank.push(newCard.rank)
                if (newCard.rank == "A") {
                    if (dealerrank.includes("A")) {
                        newCard.value = 1
                    } else {
                        newCard.value = 11
                    }
                }
                dealervalue += newCard.value
                if (dealervalue > 21 && dealerrank.includes("A")) {
                    let unu = 0
                    dealercard.forEach(e => {
                        if (e.rank == "A") {
                            dealercard[unu].value = 1
                            dealervalue = dealercard.map(d => d.value).reduce((a, b) => b + a)
                        }
                        unu++
                    })
                }
            }

            finalResult2 = await this.hit(message, userId, options.secondHand, dealercard, DECK, options)
            let yourvalue2 = finalResult2.ycard.map(c => c.value).reduce((a, b) => b + a)
            let yourcard2 = finalResult2.ycard
            let bj1 = false
            let bj2 = false
            let dbj1 = false
            let dbj2 = false
            if ((yourvalue === 21 && yourcard.length === 2) && ((dealervalue === 21 && dealercard.length != 2) || (dealervalue != 21))) {
                bj1 = true;
            }
            if ((yourvalue2 === 21 && yourcard2.length === 2) && ((dealervalue === 21 && dealercard.length != 2) || (dealervalue != 21))) {
                bj2 = true;
            }
            if ((dealervalue === 21 && dealercard.length === 2) && ((yourvalue === 21 && yourcard.length != 2) || (yourvalue != 21))) {
                dbj1 = true;
            }
            if ((dealervalue === 21 && dealercard.length === 2) && ((yourvalue2 === 21 && yourcard2.length != 2) || (yourvalue2 != 21))) {
                dbj2 = true;
            }

            if (options.isDoubleDown !== true) {

                if (yourvalue > 21 && yourvalue2 > 21) {
                    finalResult = { result: "SPLIT LOSE-LOSE", method: `1st Hand: You lost (busted).\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && bj2 == true) {
                    finalResult = { result: "SPLIT LOSE-BLACKJACK", method: `1st Hand: You lost (busted).\n2nd Hand: You won with blackjack.`, ycard: yourcard, ycard2: yourcard2, ycard2: finalResult2.ycard, dcard: dealercard }
                }

                else if (bj1 == true && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT BLACKJACK-LOSE`, method: `1st Hand: You won with blackjack.\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && bj2 == true) {
                    finalResult = { result: `SPLIT BLACKJACK-BLACKJACK`, method: `1st Hand: You won with blackjack.\n2nd Hand: You won with blackjack.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT LOSE-WIN`, method: `1st Hand: You lost (busted).\n2nd Hand: You won with more points.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT WIN-LOSE`, method: `1st Hand: You won with more points.\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT WIN-WIN`, method: `1st Hand: You won with more points.\n2nd Hand: You won with more points.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21 && bj1 == false) && (dealervalue > yourvalue2 && dealervalue > 21 && yourvalue2 <= 21 && bj2 == false)) {
                    finalResult = { result: `SPLIT WIN-WIN`, method: `1st Hand: You won (dealer busted).\n2nd Hand: You won (dealer busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (dealervalue > yourvalue2 && dealervalue > 21 && yourvalue2 <= 21 && bj2 == false)) {
                    finalResult = { result: `SPLIT BLACKJACK-WIN`, method: `1st Hand: You won with blackjack.\n2nd Hand: You won (dealer busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21 && bj1 == false) && bj2 == true) {
                    finalResult = { result: `SPLIT WIN-BLACKJACK`, method: `1st Hand: You won (dealer busted).\n2nd Hand: You won with blackjack.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (dealervalue > yourvalue2 && dealervalue > 21 && yourvalue2 <= 21 && bj1 == false)) {
                    finalResult = { result: `SPLIT LOSE-WIN`, method: `1st Hand: You lost (busted).\n2nd Hand: You won (dealer busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21 && bj1 == false) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT WIN-LOSE`, method: `1st Hand: You won (dealer busted).\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (dbj1 == true && dbj2 == true) {
                    finalResult = { result: `SPLIT LOSE-LOSE`, method: `1st Hand: You lost (dealer had blackjack).\n2nd Hand: You lost (dealer had blackjack).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && dbj2 == true) {
                    finalResult = { result: `SPLIT LOSE-LOSE`, method: `1st Hand: You lost (busted).\n2nd Hand: You lost (dealer had blackjack).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (dbj1 == true && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT LOSE-LOSE`, method: `1st Hand: You lost (dealer had blackjack).\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT LOSE-LOSE`, method: `1st Hand: You lost (dealer had more points).\n2nd Hand: You lost (dealer had more points).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT WIN-LOSE`, method: `1st Hand: You won with more points.\n2nd Hand: You lost (dealer had more points).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT LOSE-WIN`, method: `1st Hand: You lost (dealer had more points).\n2nd Hand: You won with more points.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT BLACKJACK-LOSE`, method: `1st Hand: You won with blackjack.\n2nd Hand: You lost (dealer had more points).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && bj2 == true) {
                    finalResult = { result: `SPLIT LOSE-BLACKJACK`, method: `1st Hand: You lost (dealer had more points).\n2nd Hand: You won with blackjack.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT LOSE-LOSE`, method: `1st Hand: You lost (busted).\n2nd Hand: You lost (dealer had more points).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT LOSE-LOSE`, method: `1st Hand: You lost (dealer had more points).\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT LOSE-TIE`, method: `1st Hand: You lost (busted).\n2nd Hand: You tied.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT TIE-LOSE`, method: `1st Hand: You tied.\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT BLACKJACK-TIE`, method: `1st Hand: You won with blackjack.\n2nd Hand: You tied.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && bj2 == true) {
                    finalResult = { result: `SPLIT TIE-BLACKJACK`, method: `1st Hand: You tied.\n2nd Hand: You won with blackjack.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }


                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT WIN-TIE`, method: `1st Hand: You won with more points.\n2nd Hand: You tied.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT TIE-WIN`, method: `1st Hand: You tied.\n2nd Hand: You won with more points.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (dbj1 == true && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT LOSE-TIE`, method: `1st Hand: You lost (dealer had blackjack).\n2nd Hand: You tied.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && dbj2 == true) {
                    finalResult = { result: `SPLIT TIE-LOSE`, method: `1st Hand: You tied.\n2nd Hand: You lost (dealer had blackjack).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT LOSE-TIE`, method: `1st Hand: You lost (dealer had more points).\n2nd Hand: You tied.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT TIE-LOSE`, method: `1st Hand: You tied.\n2nd Hand: You lost (dealer had more points).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT TIE-TIE`, method: `1st Hand: You tied.\n2nd Hand: You tied.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && bj2 == true) {
                    finalResult = { result: `SPLIT WIN-WIN`, method: `1st Hand: You won with more points.\n2nd Hand: You won with blackjack.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT WIN-WIN`, method: `1st Hand: You won with blackjack.\n2nd Hand: You won with more points.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

            } else if (options.isDoubleDown == true && options.isFirstSplitDouble == true && options.isSecondSplitDouble != true) {

                if (yourvalue > 21 && yourvalue2 > 21) {
                    finalResult = { result: "SPLIT DOUBLE LOSE-LOSE", method: `1st Hand: You lost (busted) (double).\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && bj2 == true) {
                    finalResult = { result: "SPLIT DOUBLE LOSE-BLACKJACK", method: `1st Hand: You lost (busted) (double).\n2nd Hand: You won with blackjack.`, ycard: yourcard, ycard2: yourcard2, ycard2: finalResult2.ycard, dcard: dealercard }
                }

                else if (bj1 == true && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT DOUBLE BLACKJACK-LOSE`, method: `1st Hand: You won with blackjack (double).\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && bj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE BLACKJACK-BLACKJACK`, method: `1st Hand: You won with blackjack (double).\n2nd Hand: You won with blackjack.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-WIN`, method: `1st Hand: You lost (busted) (double).\n2nd Hand: You won with more points.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT DOUBLE WIN-LOSE`, method: `1st Hand: You won with more points (double).\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT DOUBLE WIN-WIN`, method: `1st Hand: You won with more points (double).\n2nd Hand: You won with more points.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21 && bj1 == false) && (dealervalue > yourvalue2 && dealervalue > 21 && yourvalue2 <= 21 && bj2 == false)) {
                    finalResult = { result: `SPLIT DOUBLE WIN-WIN`, method: `1st Hand: You won (dealer busted) (double).\n2nd Hand: You won (dealer busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (dealervalue > yourvalue2 && dealervalue > 21 && yourvalue2 <= 21 && bj2 == false)) {
                    finalResult = { result: `SPLIT DOUBLE LACKJACK-WIN`, method: `1st Hand: You won with blackjack (double).\n2nd Hand: You won (dealer busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21 && bj1 == false) && bj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE WIN-BLACKJACK`, method: `1st Hand: You won (dealer busted) (double).\n2nd Hand: You won with blackjack.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (dealervalue > yourvalue2 && dealervalue > 21 && yourvalue2 <= 21 && bj1 == false)) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-WIN`, method: `1st Hand: You lost (busted) (double).\n2nd Hand: You won (dealer busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21 && bj1 == false) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT DOUBLE WIN-LOSE`, method: `1st Hand: You won (dealer busted) (double).\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (dbj1 == true && dbj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-LOSE`, method: `1st Hand: You lost (dealer had blackjack) (double).\n2nd Hand: You lost (dealer had blackjack).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && dbj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-LOSE`, method: `1st Hand: You lost (busted) (double).\n2nd Hand: You lost (dealer had blackjack).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (dbj1 == true && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-LOSE`, method: `1st Hand: You lost (dealer had blackjack) (double).\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-LOSE`, method: `1st Hand: You lost (dealer had more points) (double).\n2nd Hand: You lost (dealer had more points).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT DOUBLE WIN-LOSE`, method: `1st Hand: You won with more points (double).\n2nd Hand: You lost (dealer had more points).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-WIN`, method: `1st Hand: You lost (dealer had more points) (double).\n2nd Hand: You won with more points.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT DOUBLE BLACKJACK-LOSE`, method: `1st Hand: You won with blackjack (double).\n2nd Hand: You lost (dealer had more points).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && bj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-BLACKJACK`, method: `1st Hand: You lost (dealer had more points) (double).\n2nd Hand: You won with blackjack.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-LOSE`, method: `1st Hand: You lost (busted) (double).\n2nd Hand: You lost (dealer had more points).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-LOSE`, method: `1st Hand: You lost (dealer had more points) (double).\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-TIE`, method: `1st Hand: You lost (busted) (double).\n2nd Hand: You tied.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT DOUBLE TIE-LOSE`, method: `1st Hand: You tied (double).\n2nd Hand: You lost (busted).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT DOUBLE BLACKJACK-TIE`, method: `1st Hand: You won with blackjack (double).\n2nd Hand: You tied.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && bj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE TIE-BLACKJACK`, method: `1st Hand: You tied (double).\n2nd Hand: You won with blackjack.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }


                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT DOUBLE WIN-TIE`, method: `1st Hand: You won with more points (double).\n2nd Hand: You tied.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT DOUBLE TIE-WIN`, method: `1st Hand: You tied (double).\n2nd Hand: You won with more points.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (dbj1 == true && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-TIE`, method: `1st Hand: You lost (dealer had blackjack) (double).\n2nd Hand: You tied.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && dbj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE TIE-LOSE`, method: `1st Hand: You tied (double).\n2nd Hand: You lost (dealer had blackjack).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-TIE`, method: `1st Hand: You lost (dealer had more points) (double).\n2nd Hand: You tied.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT DOUBLE TIE-LOSE`, method: `1st Hand: You tied (double).\n2nd Hand: You lost (dealer had more points).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT DOUBLE TIE-TIE`, method: `1st Hand: You tied (double).\n2nd Hand: You tied.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && bj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE WIN-WIN`, method: `1st Hand: You won with more points (double).\n2nd Hand: You won with blackjack.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT DOUBLE WIN-WIN`, method: `1st Hand: You won with blackjack (double).\n2nd Hand: You won with more points.`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }
            }
            else if (options.isDoubleDown == true && options.isFirstSplitDouble != true && options.isSecondSplitDouble == true) {


                if (yourvalue > 21 && yourvalue2 > 21) {
                    finalResult = { result: "SPLIT LOSE-DOUBLE LOSE", method: `1st Hand: You lost (busted).\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && bj2 == true) {
                    finalResult = { result: "SPLIT LOSE-DOUBLE BLACKJACK", method: `1st Hand: You lost (busted).\n2nd Hand: You won with blackjack (double).`, ycard: yourcard, ycard2: yourcard2, ycard2: finalResult2.ycard, dcard: dealercard }
                }

                else if (bj1 == true && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT BLACKJACK-DOUBLE LOSE`, method: `1st Hand: You won with blackjack.\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && bj2 == true) {
                    finalResult = { result: `SPLIT BLACKJACK-DOUBLE BLACKJACK`, method: `1st Hand: You won with blackjack.\n2nd Hand: You won with blackjack (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE WIN`, method: `1st Hand: You lost (busted).\n2nd Hand: You won with more points (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT WIN-DOUBLE LOSE`, method: `1st Hand: You won with more points.\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT WIN-DOUBLE WIN`, method: `1st Hand: You won with more points.\n2nd Hand: You won with more points (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21 && bj1 == false) && (dealervalue > yourvalue2 && dealervalue > 21 && yourvalue2 <= 21 && bj2 == false)) {
                    finalResult = { result: `SPLIT WIN-DOUBLE WIN`, method: `1st Hand: You won (dealer busted).\n2nd Hand: You won (dealer busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (dealervalue > yourvalue2 && dealervalue > 21 && yourvalue2 <= 21 && bj2 == false)) {
                    finalResult = { result: `SPLIT BLACKJACK-DOUBLE WIN`, method: `1st Hand: You won with blackjack.\n2nd Hand: You won (dealer busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21 && bj1 == false) && bj2 == true) {
                    finalResult = { result: `SPLIT WIN-DOUBLE BLACKJACK`, method: `1st Hand: You won (dealer busted).\n2nd Hand: You won with blackjack (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (dealervalue > yourvalue2 && dealervalue > 21 && yourvalue2 <= 21 && bj1 == false)) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE WIN`, method: `1st Hand: You lost (busted).\n2nd Hand: You won (dealer busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21 && bj1 == false) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT WIN-DOUBLE LOSE`, method: `1st Hand: You won (dealer busted).\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (dbj1 == true && dbj2 == true) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE LOSE`, method: `1st Hand: You lost (dealer had blackjack).\n2nd Hand: You lost (dealer had blackjack) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && dbj2 == true) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE LOSE`, method: `1st Hand: You lost (busted).\n2nd Hand: You lost (dealer had blackjack) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (dbj1 == true && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE LOSE`, method: `1st Hand: You lost (dealer had blackjack).\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE LOSE`, method: `1st Hand: You lost (dealer had more points).\n2nd Hand: You lost (dealer had more points) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT WIN-DOUBLE LOSE`, method: `1st Hand: You won with more points.\n2nd Hand: You lost (dealer had more points) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE WIN`, method: `1st Hand: You lost (dealer had more points).\n2nd Hand: You won with more points (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT BLACKJACK-DOUBLE LOSE`, method: `1st Hand: You won with blackjack.\n2nd Hand: You lost (dealer had more points) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && bj2 == true) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE BLACKJACK`, method: `1st Hand: You lost (dealer had more points).\n2nd Hand: You won with blackjack (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE LOSE`, method: `1st Hand: You lost (busted).\n2nd Hand: You lost (dealer had more points) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE LOSE`, method: `1st Hand: You lost (dealer had more points).\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE TIE`, method: `1st Hand: You lost (busted).\n2nd Hand: You tied (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT TIE-DOUBLE LOSE`, method: `1st Hand: You tied.\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT BLACKJACK-DOUBLE TIE`, method: `1st Hand: You won with blackjack.\n2nd Hand: You tied (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && bj2 == true) {
                    finalResult = { result: `SPLIT TIE-DOUBLE BLACKJACK`, method: `1st Hand: You tied.\n2nd Hand: You won with blackjack (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }


                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT WIN-DOUBLE TIE`, method: `1st Hand: You won with more points.\n2nd Hand: You tied (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT TIE-DOUBLE WIN`, method: `1st Hand: You tied.\n2nd Hand: You won with more points (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (dbj1 == true && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE TIE`, method: `1st Hand: You lost (dealer had blackjack).\n2nd Hand: You tied (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && dbj2 == true) {
                    finalResult = { result: `SPLIT TIE-DOUBLE LOSE`, method: `1st Hand: You tied.\n2nd Hand: You lost (dealer had blackjack) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT LOSE-DOUBLE TIE`, method: `1st Hand: You lost (dealer had more points).\n2nd Hand: You tied (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT TIE-DOUBLE LOSE`, method: `1st Hand: You tied.\n2nd Hand: You lost (dealer had more points) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT TIE-DOUBLE TIE`, method: `1st Hand: You tied.\n2nd Hand: You tied (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && bj2 == true) {
                    finalResult = { result: `SPLIT WIN-DOUBLE WIN`, method: `1st Hand: You won with more points.\n2nd Hand: You won with blackjack (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT WIN-DOUBLE WIN`, method: `1st Hand: You won with blackjack.\n2nd Hand: You won with more points (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }
            }
            else if (options.isDoubleDown == true && options.isFirstSplitDouble == true && options.isSecondSplitDouble == true) {

                if (yourvalue > 21 && yourvalue2 > 21) {
                    finalResult = { result: "SPLIT DOUBLE LOSE-DOUBLE LOSE", method: `1st Hand: You lost (busted) (double).\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && bj2 == true) {
                    finalResult = { result: "SPLIT DOUBLE LOSE-DOUBLE BLACKJACK", method: `1st Hand: You lost (busted) (double).\n2nd Hand: You won with blackjack (double).`, ycard: yourcard, ycard2: yourcard2, ycard2: finalResult2.ycard, dcard: dealercard }
                }

                else if (bj1 == true && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT DOUBLE BLACKJACK-DOUBLE LOSE`, method: `1st Hand: You won with blackjack (double).\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && bj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE BLACKJACK-DOUBLE BLACKJACK`, method: `1st Hand: You won with blackjack (double).\n2nd Hand: You won with blackjack (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE WIN`, method: `1st Hand: You lost (busted) (double).\n2nd Hand: You won with more points (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT DOUBLE WIN-DOUBLE LOSE`, method: `1st Hand: You won with more points (double).\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT DOUBLE WIN-DOUBLE WIN`, method: `1st Hand: You won with more points (double).\n2nd Hand: You won with more points (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21 && bj1 == false) && (dealervalue > yourvalue2 && dealervalue > 21 && yourvalue2 <= 21 && bj2 == false)) {
                    finalResult = { result: `SPLIT DOUBLE WIN-DOUBLE WIN`, method: `1st Hand: You won (dealer busted) (double).\n2nd Hand: You won (dealer busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (dealervalue > yourvalue2 && dealervalue > 21 && yourvalue2 <= 21 && bj2 == false)) {
                    finalResult = { result: `SPLIT DOUBLE BLACKJACK-DOUBLE WIN`, method: `1st Hand: You won with blackjack (double).\n2nd Hand: You won (dealer busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21 && bj1 == false) && bj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE WIN-DOUBLE BLACKJACK`, method: `1st Hand: You won (dealer busted) (double).\n2nd Hand: You won with blackjack (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (dealervalue > yourvalue2 && dealervalue > 21 && yourvalue2 <= 21 && bj1 == false)) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE WIN`, method: `1st Hand: You lost (busted) (double).\n2nd Hand: You won (dealer busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21 && bj1 == false) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT DOUBLE WIN-DOUBLE LOSE`, method: `1st Hand: You won (dealer busted) (double).\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (dbj1 == true && dbj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE LOSE`, method: `1st Hand: You lost (dealer had blackjack) (double).\n2nd Hand: You lost (dealer had blackjack) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && dbj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE LOSE`, method: `1st Hand: You lost (busted) (double).\n2nd Hand: You lost (dealer had blackjack) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (dbj1 == true && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE LOSE`, method: `1st Hand: You lost (dealer had blackjack) (double).\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE LOSE`, method: `1st Hand: You lost (dealer had more points) (double).\n2nd Hand: You lost (dealer had more points) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT DOUBLE WIN-DOUBLE LOSE`, method: `1st Hand: You won with more points (double).\n2nd Hand: You lost (dealer had more points) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE WIN`, method: `1st Hand: You lost (dealer had more points) (double).\n2nd Hand: You won with more points (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT DOUBLE BLACKJACK-DOUBLE LOSE`, method: `1st Hand: You won with blackjack (double).\n2nd Hand: You lost (dealer had more points) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && bj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE BLACKJACK`, method: `1st Hand: You lost (dealer had more points) (double).\n2nd Hand: You won with blackjack (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE LOSE`, method: `1st Hand: You lost (busted) (double).\n2nd Hand: You lost (dealer had more points) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE LOSE`, method: `1st Hand: You lost (dealer had more points) (double).\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (yourvalue > 21 && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE TIE`, method: `1st Hand: You lost (busted) (double).\n2nd Hand: You tied (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && yourvalue2 > 21) {
                    finalResult = { result: `SPLIT DOUBLE TIE-DOUBLE LOSE`, method: `1st Hand: You tied (double).\n2nd Hand: You lost (busted) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT DOUBLE BLACKJACK-DOUBLE TIE`, method: `1st Hand: You won with blackjack (double).\n2nd Hand: You tied (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && bj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE TIE-DOUBLE BLACKJACK`, method: `1st Hand: You tied (double).\n2nd Hand: You won with blackjack (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }


                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT DOUBLE WIN-DOUBLE TIE`, method: `1st Hand: You won with more points (double).\n2nd Hand: You tied (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT DOUBLE TIE-DOUBLE WIN`, method: `1st Hand: You tied (double).\n2nd Hand: You won with more points (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (dbj1 == true && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE TIE`, method: `1st Hand: You lost (dealer had blackjack) (double).\n2nd Hand: You tied (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && dbj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE TIE-DOUBLE LOSE`, method: `1st Hand: You tied (double).\n2nd Hand: You lost (dealer had blackjack) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue > yourvalue && dealervalue <= 21) && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT DOUBLE LOSE-DOUBLE TIE`, method: `1st Hand: You lost (dealer had more points) (double).\n2nd Hand: You tied (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && (dealervalue > yourvalue2 && dealervalue <= 21)) {
                    finalResult = { result: `SPLIT DOUBLE TIE-DOUBLE LOSE`, method: `1st Hand: You tied (double).\n2nd Hand: You lost (dealer had more points) (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((dealervalue === yourvalue) && (dealervalue === yourvalue2)) {
                    finalResult = { result: `SPLIT DOUBLE TIE-DOUBLE TIE`, method: `1st Hand: You tied (double).\n2nd Hand: You tied (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if ((yourvalue <= 21 && bj1 == false && (dealervalue < yourvalue)) && bj2 == true) {
                    finalResult = { result: `SPLIT DOUBLE WIN-DOUBLE WIN`, method: `1st Hand: You won with more points (double).\n2nd Hand: You won with blackjack (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }

                else if (bj1 == true && (yourvalue2 <= 21 && bj2 == false && (dealervalue < yourvalue2))) {
                    finalResult = { result: `SPLIT DOUBLE WIN-DOUBLE WIN`, method: `1st Hand: You won with blackjack (double).\n2nd Hand: You won with more points (double).`, ycard: yourcard, ycard2: yourcard2, dcard: dealercard }
                }
            }

            return finalResult
        }

        if (options.isSplit === "second") {

            options.isSplit = "done";
            if (options.isDoubleDown !== true) {
                if (yourvalue > 21) {
                    finalResult2 = { result: "LOSE", method: "You busted", ycard: yourcard, dcard: dealercard }
                } else if (yourvalue === 21) {
                    finalResult2 = { result: "WIN", method: "You had blackjack", ycard: yourcard, dcard: dealercard }
                } else if (yourvalue < 21 && dealervalue < yourvalue) {
                    finalResult2 = { result: "WIN", method: "You had more", ycard: yourcard, dcard: dealercard }
                } else if (dealervalue > yourvalue && dealervalue > 21 && yourvalue < 21) {
                    finalResult2 = { result: "WIN", method: "Dealer busted", ycard: yourcard, dcard: dealercard }
                } else if (dealervalue === 21 && yourvalue < 21) {
                    finalResult2 = { result: "LOSE", method: "Dealer had blackjack", ycard: yourcard, dcard: dealercard }
                } else if (dealervalue > yourvalue && dealervalue < 21) {
                    finalResult2 = { result: "LOSE", method: "Dealer had more", ycard: yourcard, dcard: dealercard }
                } else if (dealervalue === yourvalue) {
                    finalResult2 = { result: "TIE", method: "Tie", ycard: yourcard, dcard: dealercard }
                }
            } else if (options.isDoubleDown === true) {
                if (yourvalue > 21) {
                    finalResult2 = { result: "DOUBLE LOSE", method: "You busted", ycard: yourcard, dcard: dealercard }
                } else if (yourvalue === 21) {
                    finalResult2 = { result: "DOUBLE WIN", method: "You had blackjack", ycard: yourcard, dcard: dealercard }
                } else if (yourvalue < 21 && dealervalue < yourvalue) {
                    finalResult2 = { result: "DOUBLE WIN", method: "You had more", ycard: yourcard, dcard: dealercard }
                } else if (dealervalue > yourvalue && dealervalue > 21 && yourvalue < 21) {
                    finalResult2 = { result: "DOUBLE WIN", method: "Dealer busted", ycard: yourcard, dcard: dealercard }
                } else if (dealervalue === 21 && yourvalue < 21) {
                    finalResult2 = { result: "DOUBLE LOSE", method: "Dealer had blackjack", ycard: yourcard, dcard: dealercard }
                } else if (dealervalue > yourvalue && dealervalue < 21) {
                    finalResult2 = { result: "DOUBLE LOSE", method: "Dealer had more", ycard: yourcard, dcard: dealercard }
                } else if (dealervalue === yourvalue) {
                    finalResult2 = { result: "DOUBLE TIE", method: "Tie", ycard: yourcard, dcard: dealercard }
                }
            }
            if (options.transition === "edit") {
                message = await message.edit({ embeds: message.embeds, components: [] })
                finalResult2.message = message
            } else {
                await message.delete()
            }
            return finalResult2
        } else {

            if ((dealervalue === 21 && dealercard.length === 2)) {
                if (options.hasInsurance == true) {
                    finalResult = { result: "INSURANCE PAYOUT", method: "You receive insurance against dealer blackjack.", ycard: yourcard, dcard: dealercard }
                    if (options.transition === "edit") {
                        message = await message.edit({ embeds: message.embeds, components: [] })
                        finalResult2.message = message
                    } else {
                        await message.delete()
                    }
                    return finalResult
                }
                else {
                    finalResult = { result: "LOSE", method: "You lost (dealer had blackjack).", ycard: yourcard, dcard: dealercard }
                    if (options.transition === "edit") {
                        message = await message.edit({ embeds: message.embeds, components: [] })
                        finalResult2.message = message
                    } else {
                        await message.delete()
                    }
                    return finalResult
                }
            }

            else {
                let dealerrank = [dealercard[0].rank, dealercard[1].rank]
                let finalResult = {}
                while (dealervalue < 17) {
                    let newCard = DECK.pop()
                    dealercard.push(newCard)
                    dealerrank.push(newCard.rank)
                    if (newCard.rank == "A") {
                        if (dealerrank.includes("A")) {
                            newCard.value = 1
                        } else {
                            newCard.value = 11
                        }
                    }
                    dealervalue += newCard.value
                    if (dealervalue > 21 && dealerrank.includes("A")) {
                        let unu = 0
                        dealercard.forEach(e => {
                            if (e.rank == "A") {
                                dealercard[unu].value = 1
                                dealervalue = dealercard.map(d => d.value).reduce((a, b) => b + a)
                            }
                            unu++
                        })
                    }
                }

                if (options.hasInsurance == true) {
                    if (yourvalue > 21) {
                        finalResult = { result: "INSURANCE LOSE", method: "You lost (busted).", ycard: yourcard, dcard: dealercard }
                    } else if ((yourvalue <= 21 && (dealervalue < yourvalue))) {
                        finalResult = { result: "INSURANCE WIN", method: "You won with more points.", ycard: yourcard, dcard: dealercard }
                    } else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21)) {
                        finalResult = { result: "INSURANCE WIN", method: "You won (dealer busted).", ycard: yourcard, dcard: dealercard }
                    } else if ((dealervalue > yourvalue && dealervalue <= 21)) {
                        finalResult = { result: "INSURANCE LOSE", method: "You lost (dealer had more points).", ycard: yourcard, dcard: dealercard }
                    } else if (dealervalue === yourvalue) {
                        finalResult = { result: "INSURANCE TIE", method: "You tied.", ycard: yourcard, dcard: dealercard }
                    }
                }
                else if (options.hasInsurance !== true) {
                    if (options.isDoubleDown !== true) {
                        if (yourvalue > 21) {
                            finalResult = { result: "LOSE", method: "You lost (busted).", ycard: yourcard, dcard: dealercard }
                        } else if ((yourvalue <= 21 && (dealervalue < yourvalue))) {
                            finalResult = { result: "WIN", method: "You won with more points.", ycard: yourcard, dcard: dealercard }
                        } else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21)) {
                            finalResult = { result: "WIN", method: "You won (dealer busted).", ycard: yourcard, dcard: dealercard }
                        } else if ((dealervalue > yourvalue && dealervalue <= 21)) {
                            finalResult = { result: "LOSE", method: "You lost (dealer had more points).", ycard: yourcard, dcard: dealercard }
                        } else if (dealervalue === yourvalue) {
                            finalResult = { result: "TIE", method: "You tied.", ycard: yourcard, dcard: dealercard }
                        }
                    } else if (options.isDoubleDown === true) {
                        if (yourvalue > 21) {
                            finalResult = { result: "DOUBLE LOSE", method: "Double: You busted.", ycard: yourcard, dcard: dealercard }
                        } else if ((yourvalue <= 21 && (dealervalue < yourvalue))) {
                            finalResult = { result: "DOUBLE WIN", method: "Double: You won with more points.", ycard: yourcard, dcard: dealercard }
                        } else if ((dealervalue > yourvalue && dealervalue > 21 && yourvalue <= 21)) {
                            finalResult = { result: "DOUBLE WIN", method: "Double: You won (dealer busted).", ycard: yourcard, dcard: dealercard }
                        } else if ((dealervalue > yourvalue && dealervalue <= 21)) {
                            finalResult = { result: "DOUBLE LOSE", method: "Double: You lost (dealer had more points).", ycard: yourcard, dcard: dealercard }
                        } else if (dealervalue === yourvalue) {
                            finalResult = { result: "DOUBLE TIE", method: "Double: You tied.", ycard: yourcard, dcard: dealercard }
                        }
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
        }
    }


    async doubledown(message, userId, yourcard, dealercard, DECK, options) {
        options.isDoubleDown = true
        if (options.isSplit === "first") {
            options.isFirstSplitDouble = true
        }
        if (options.isSplit === "second") {
            options.isSecondSplitDouble = true
        }
        let isSoft = false
        let newCard = DECK.pop()
        if (newCard.rank === "A") {
            if (yourcard.map(c => c.rank).includes("A")) {
                newCard.value = 1
            } else {
                newCard.value = 11
            }
        }

        yourcard.push(newCard)

        if (yourcard.map(c => c.rank).includes("A") && yourcard.find(c => c.rank === "A" && c.value === 11)) {
            isSoft = true
        }

        if (yourcard.map(c => c.value).reduce((a, b) => b + a) > 21 && isSoft == true) {
            isSoft = false
            for (let y = 0; y < yourcard.length; y++) {
                if (yourcard[y].rank === "A") {
                    yourcard[y].value = 1
                }
            }
        }

        return this.stand(message, userId, yourcard, dealercard, DECK, options)
    }

    async insurance(message, userId, yourcard, dealercard, DECK, options) {
        options.hasInsurance = true
        let dealervalue = dealercard.map(c => c.value).reduce((a, b) => b + a)

        if (dealervalue === 21) {
            return this.stand(message, userId, yourcard, dealercard, DECK, options)
        }

        else {
            let embed = options.embed
            let hitbtn = { label: "Hit", style: 1, custom_id: "discord-blackjack-hitbtn", type: 2 }
            let standbtn = { label: "Stand", style: 1, custom_id: "discord-blackjack-standbtn", type: 2 }
            let ddownbtn = { label: "Double Down", style: 1, custom_id: "discord-blackjack-ddownbtn", type: 2 }
            let splitbtn = { label: "Split", style: 1, custom_id: "discord-blackjack-splitbtn", type: 2 }
            let cancelbtn = { label: "Cancel", style: 4, custom_id: "discord-blackjack-cancelbtn", type: 2 }
            let row1 = { type: 1, components: [hitbtn, standbtn] }
            let row2 = { type: 1, components: [cancelbtn] }
            let components = [row1, row2]
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
    }

    async noinsurance(message, userId, yourcard, dealercard, DECK, options) {
        options.hasInsurance = false
        let dealervalue = dealercard.map(c => c.value).reduce((a, b) => b + a)

        if (dealervalue === 21) {
            return this.stand(message, userId, yourcard, dealercard, DECK, options)
        }

        else {
            let embed = options.embed
            let hitbtn = { label: "Hit", style: 1, custom_id: "discord-blackjack-hitbtn", type: 2 }
            let standbtn = { label: "Stand", style: 1, custom_id: "discord-blackjack-standbtn", type: 2 }
            let ddownbtn = { label: "Double Down", style: 1, custom_id: "discord-blackjack-ddownbtn", type: 2 }
            let splitbtn = { label: "Split", style: 1, custom_id: "discord-blackjack-splitbtn", type: 2 }
            let cancelbtn = { label: "Cancel", style: 4, custom_id: "discord-blackjack-cancelbtn", type: 2 }
            let row1 = { type: 1, components: [hitbtn, standbtn] }
            let row2 = { type: 1, components: [cancelbtn] }
            let components = [row1, row2]
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
    }

    async split(message, userId, yourcard, dealercard, DECK, options) {
        options.isSplit = "first"
        let yourcard2 = [yourcard.pop()]

        if (yourcard[0].rank === "A") {
            yourcard[0].value = 11
        }

        if (yourcard2[0].rank === "A") {
            yourcard2[0].value = 11
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
