export { Message, CommandInteraction, MessageEmbed } from "discord.js"

declare module "discord-blackjack" {
    export function Main(message: Message | CommandInteraction, options?: MainOptions): Promise<FinalResult>

    declare interface MainOptions {
        transition?: "edit" | "delete"
        buttons?: boolean
        doubledown?: boolean
        split?: boolean
        resultEmbed?: boolean
        normalEmbed?: boolean
        normalEmbedContent?: MessageEmbed
        emojis?: OptionEmojis
    }

    declare interface OptionEmojis {
        clubs: string | "♣️"
        spades: string | "♠️"
        hearts: string | "♥️"
        diamonds: string | "♦️"
    }

    declare interface FinalResult {
        result: string
        method: string
        ycard: Array<Card>
        dcard: Array<Card>
        message?: Message
    }

    declare interface Card {
        suit: string
        rank: string
        value: number
        emoji: string
    }
}
