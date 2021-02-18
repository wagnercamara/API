const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authConfig = require('../../config/auth.json'); 
const User = require('../../models/user');

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

    const token = { id: user.id }

    res.send({ 
        user,
        token: generateToken({id: user.id }),
    });

});

router.post('/forgot_password', async (req, res) => {
    

});

module.exports = app => app.use('/auth', router);
