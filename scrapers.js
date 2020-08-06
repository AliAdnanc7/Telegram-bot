const puppeteer = require('puppeteer')

async function scrape(url, callback) {

    try{
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox"]
        })
        const page = await browser.newPage()
        await page.goto(url)
        await callback(page)
        browser.close()

    }catch(e) {
        console.log(e)
    }

}

module.exports = scrape