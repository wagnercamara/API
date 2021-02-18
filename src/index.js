//importação
const express = require('express');
const bodyParser = require('body-parser');

// Iniciando aplicação
const app = express();

// para enviar e receber json
app.use(bodyParser.json());

//para entender o que está vindo na url
app.use(bodyParser.urlencoded({ extended: false })); 

// criado rotas 
// req são os dados da requisição (paramentros, tokens, etc)
// res objeto ultilizado para enviar a resposta ao usuário quando acessar esta rota
// app.get('/',(req, res)=>{
//     res.send('OK');
// });

require('./app/controllers/index')(app);

app.listen(3000);

