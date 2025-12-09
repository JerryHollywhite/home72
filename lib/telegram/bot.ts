import TelegramBot from 'node-telegram-bot-api'

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false })

export async function sendMessage(chatId: number, text: string, options?: any) {
    try {
        await bot.sendMessage(chatId, text, options)
        return { success: true }
    } catch (error) {
        console.error('Telegram send message error:', error)
        return { success: false, error }
    }
}

export async function sendPhoto(chatId: number, photo: string | Buffer, caption?: string) {
    try {
        await bot.sendPhoto(chatId, photo, { caption })
        return { success: true }
    } catch (error) {
        console.error('Telegram send photo error:', error)
        return { success: false, error }
    }
}

export async function sendDocument(chatId: number, document: string | Buffer, options?: any) {
    try {
        await bot.sendDocument(chatId, document, options)
        return { success: true }
    } catch (error) {
        console.error('Telegram send document error:', error)
        return { success: false, error }
    }
}

export function getKeyboard(buttons: string[][]) {
    return {
        reply_markup: {
            keyboard: buttons,
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    }
}

export function getInlineKeyboard(buttons: Array<Array<{ text: string; callback_data: string }>>) {
    return {
        reply_markup: {
            inline_keyboard: buttons,
        },
    }
}

export { bot }
