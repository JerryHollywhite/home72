import { NextRequest, NextResponse } from 'next/server'
import TelegramBot from 'node-telegram-bot-api'

export async function GET(request: NextRequest) {
    const token = process.env.TELEGRAM_BOT_TOKEN

    if (!token) {
        return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const host = request.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const domain = searchParams.get('domain') || `${protocol}://${host}`
    const webhookUrl = `${domain}/api/telegram/webhook`

    try {
        const bot = new TelegramBot(token, { polling: false })
        const result = await bot.setWebHook(webhookUrl)

        return NextResponse.json({
            success: true,
            message: 'Webhook set successfully',
            webhook_url: webhookUrl,
            telegram_response: result
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
