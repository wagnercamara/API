const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');

const authConfig = require('../../config/auth.json'); 
const User = require('../models/user');

const router = express.Router();

function generateToken(params = {}){
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,
    } );
}

//rota de cadastro
router.post('/register', async (req, res) => {

    const { email } = req.body;

    try{

        if (await User.findOne({ email }))
            return res.status(400).send({ erro: 'User already exists' });

        const user = await User.create(req.body);
        
        user.password = undefined;

        return res.send({ 
            user,
            token: generateToken({id: user.id }),
        });

    } catch(err) {
        return res.status(400).send({ error: 'Registration failed' });
    }
});

//rota de autenticação
router.post('/authenticate', async (req, res)=>{

    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');

    if ( !user ){
        return res.status(400).send({ error: 'User not found' });
    }

    if ( !await bcrypt.compare( password , user.password) ){
        return res.status(400).send({ error: 'Email or Password incorrect' });
    }

    user.password = undefined;

    res.send({ 
        user,
        token: generateToken({id: user.id }),
    });

});

//rota para troca de senha
router.post('/forgot_password', async (req, res) => {

    const { email } = req.body;

    try{

        //verificação de email existente
        const user = await User.findOne({ email });

        if ( !user ){
            return res.status(400).send({ error: 'User not found' });
        }

        //crindo token de 20 caracteres hexadecimal
        const token = crypto.randomBytes(20).toString('hex');

        //limite de tempo para o token ficar ativo
        const now = new Date();
        now.setHours(now.getHours() + 1);

        // auteração do usuário
        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now,
            }
        },{new: true, useFindAndModify: false});

        //enviando email com token de autenticação
        mailer.sendMail({
            to: email,
            from: 'wagner_camara@outlook.com',
            template: 'auth/forgot_password',
            context: { token },
        }, (err) => {
            if (err){
                console.log(err)
                res.status(400).send({error: 'Cannot send forgot password email'});
            }

            return res.send();
        })

    }catch(err) {
        res.status(400).send({error: 'Error on forgot password, try again'});
    }

});

router.post('/reset_pasword', async (req, res) => {

    const { email, token, password } = req.body;

    try{

        //verificação de email existente
        const user = await User.findOne({ email })
            .select('+passwordResetToken passwordResetExpires');

        if ( !user ){
            return res.status(400).send({ error: 'User not found' });
        }

        if (token !== user.passwordResetToken){
            return res.status(400).send({ error: 'Token invalid' });
        }

        const now = new Date();

        if (now > user.passwordResetExpires){
            return res.status(400).send({ error: 'Token expired, generate a new one' });
        }

        user.password = password;


        await user.save();

        res.send();

    }catch(err){
        return res.status(400).send({ error: 'Cannot reset password, try again' });
    }

});

module.exports = app => app.use('/auth', router);
