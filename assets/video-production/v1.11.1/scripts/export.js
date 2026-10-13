async page => {
 await page.goto('http://127.0.0.1:8778/output/playwright/renest-video/v1.11.1-polish/film.html');
 await page.setViewportSize({width:1920,height:1080});
 await page.waitForFunction(()=>window.filmReady,{timeout:120000});
 await page.evaluate(()=>window.renderAt(204));
 await page.screenshot({path:'output/playwright/renest-video/v1.11.1-polish/qa/trust-preview.png'});
 await page.evaluate(()=>{window.renderSequence({from:201,to:211,fps:60,job:'trust'}).catch(e=>window.renderError=String(e))});
}