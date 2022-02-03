const axios = require('axios'); 
let data= axios.get('https://sheet.best/api/sheets/08be6b4b-bfd3-408e-8ead-9293b6878363')

async function helle(){

    console.log(await data)
}

helle()