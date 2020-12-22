require('dotenv').config()
const telegramBot = require('node-telegram-bot-api')
const token = '1483288023:AAEJRi3flF6Oh0X-VvvcHyCKeLqron-_SkQ'
const bot = new telegramBot(token, {polling:true})
const scrape = require('./scrapers.js')

require('https').createServer().listen(process.env.PORT || 5000).on('request', function(req, res){
    res.end('')
  })

const waitMessage = (chatId) => {
    bot.sendMessage(chatId, '*Подождите ...*', {parse_mode: 'Markdown'})
}


const randomAnime = (chatId) => {
    waitMessage(chatId)

        scrape('https://yummyanime.club/random', async page => {
                
            const [el] = await page.$x('/html/body/div[3]/div[3]/div/div/div[1]/div[1]/img')
            const src = await el.getProperty('src')
            const imgUrl = await src.jsonValue()
        
            const [el2] = await page.$x('/html/body/div[3]/div[3]/div/div/h1')
            const txt = await el2.getProperty('textContent')
            let title = await txt.jsonValue()
            title = title.trim()

            const [el3] = await page.$x('/html/body/div[3]/div[3]/div/div/div[2]/span[2]/span[1]')
            const txt2 = await el3.getProperty('textContent')
            const rating = await txt2.jsonValue()

            const [el4] = await page.$x('/html/body/div[3]/div[3]/div/div/ul[2]/li[6]/ul')
            const txt3 = await el4.getProperty('innerText')
            let genres = await txt3.jsonValue()
            genres = genres.replace(/\n\s\n/g, ', ')

            const [el5] = await page.$x('//*[@id="content-desc-text"]/p')
            const txt5 = await el5.getProperty('textContent')
            const description = await txt5.jsonValue()

            const [el6] = await page.$x('/html/body/div[3]/div[3]/div/div/ul[2]/li[3]/text()')
            const txt6 = await el6.getProperty('textContent')
            const year = await txt6.jsonValue()

            bot.sendPhoto(chatId, imgUrl, {caption: `${title}(${year})\n⭐️${rating} / 10\n🏷Жанры: ${genres}\n📄Описание: ${description}`})
        })
}

const todayAnime = (chatId) => {
    waitMessage(chatId)

    scrape('https://yummyanime.club/ongoing', async page => {
        const day = new Date().getDay() - 1
        const week = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

        const [el] = await page.$x(`//*[@id="${week[day]}"]/ul`)
        const text = await el.getProperty('textContent')
        let titles = await text.jsonValue()
        const arr = titles.split('\n')
        let correctArr = []
        for(let i = 0; i < arr.length; i++) {
            if(arr[i].trim() && arr[i].trim()[1] !== '.') {
                correctArr.push(arr[i].trim())
            }
        }
        if(correctArr.length) {
            bot.sendMessage(chatId, '⚡' + correctArr.join('\n⚡'))
        } else {
            bot.sendMessage(chatId, '😔Сегодня серий не будет')
        }
    })
}

const findAnime = (chatId, query) => {
    waitMessage(chatId)

    scrape(`https://yummyanime.club/search?word=${query}`, async page => {

        const [el] = await page.$x(`/html/body/div[3]/div[3]/div/div/div[1]/a/img`)
        if(!el)
            return bot.sendMessage(chatId, 'Аниме не нашлось :(')
        const url = await el.getProperty('src')
        const imgSrc = await url.jsonValue()
    
        const [el2] = await page.$x(`/html/body/div[3]/div[3]/div/div/div[1]/div/div[2]/span[2]/span`)
        const text = await el2.getProperty('innerText')
        const rating = await text.jsonValue()
    
        const [el3] = await page.$x(`/html/body/div[3]/div[3]/div/div/div[1]/div/p`)
        const text2 = await el3.getProperty('textContent')
        const type = await text2.jsonValue()
    
        const [el4] = await page.$x(`/html/body/div[3]/div[3]/div/div/div[1]/div/a`)
        const text3 = await el4.getProperty('innerText')
        const title = await text3.jsonValue()

        bot.sendPhoto(chatId, imgSrc, {caption: `${title}\n⭐️${rating} / 10\nТип: ${type}`})

    })
    
}

const AnnouncedAnime = (chatId) => {
    waitMessage(chatId)

    scrape('https://yummyanime.club/', async page => {

        const [el] = await page.$x(`/html/body/div[3]/div[4]/div[2]/ul[2]`)
        const text = await el.getProperty('innerText')
        const announced = await text.jsonValue()
        const announArr = announced.split('\n')

        bot.sendMessage(chatId, '📅' + announArr.join('\n📅'))

    })

}

const functions = [
    {
        text: 'Случайное аниме',
        callback_data: '/randomAnime',
        function: randomAnime,
        userInput: false
    },
    {
        text: 'Серии сегодня(Аниме)',
        callback_data: '/todayAnime',
        function: todayAnime,
        userInput: false
    },
    {
        text: 'Анонсированное аниме',
        callback_data: '/AnnouncedAnime',
        function: AnnouncedAnime,
        userInput: false
    }
]

var options = {
    reply_markup: JSON.stringify({
      inline_keyboard: 
        functions.map(func => {
            if(func.userInput === false)
                return [{text: func.text, callback_data: func.callback_data}]
        })
    })
}

bot.onText(/\/find (.+)/, (msg, match) => {
    const chatId = msg.chat.id
    let userInput = match[1].trim()
    userInput = userInput.replace(/\s+/g, '+')
    findAnime(chatId, userInput)
})

bot.onText(/^(?!\/)(.+)$/, msg => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, 'МЕНЮ\nПоиск - /find Название аниме', options)
})

bot.on('callback_query', query => {
    const chatId = query.message.chat.id
    const message = query.data

    functions.map(func => {
        if(message === func.callback_data && func.userInput === false) {
            func.function(chatId)
        }
    })
})

bot.on("polling_error", msg => console.log(msg))
