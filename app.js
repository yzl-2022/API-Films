const path = require('path')

//to read the parameters in .env
require('dotenv').config()

//create an express server
const express = require('express')
const app = express()

//mustache -- templates
const mustacheExpress = require('mustache-express')

app.set('views', path.join(__dirname, './views'))
app.set('view engine', 'html')
app.engine('html', mustacheExpress())

//get the database from db.js
const db = require(path.join(__dirname, './config/db'))

//validation de données
const { check, validationResult } = require("express-validator")

//Middlewares -- add before routers
//==================================
app.use(express.static(path.join(__dirname, './public'))) //make available the folder /public
app.use(express.json()) //to read json format data in express
app.use(express.urlencoded({extended: false})) //to read form data in express

//Routers
//==================================

//films

//if there is no data inside collection `films`, implant local data into collection `films`
app.get(['/films/initialiser','/api/films/initialiser'], async function(req, res){
    try{
        const donneesFilms = require(path.join(__dirname,'./data/filmsTest.js'))

        donneesFilms.forEach(async (item, index)=>{ 
            item.id = index + 1
            await db.collection('films').doc(item.id.toString()).set(item)
        })

        res.redirect('/films')

    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }
})

app.get(['/','/films','/api/films'], async function(req, res){
    try{
        const filmsRef = await db.collection('films').orderBy('id').get() //orderBy('id') works only when id is stored as Integer(not String)

        if (filmsRef.empty) return res.redirect('/films/initialiser') //use `empty` for collection(), use `exists` for doc(id)

        const films = []

        filmsRef.forEach((doc)=>{
            films.push(doc.data())
        })
        
        res.statusCode = 200
        //res.json(films)
        res.render('index', { films: films })

    }catch(err){
        console.log(err)
        res.status(500).send(err)
    } 
})

app.post(['/','/films','/api/films'],
        [
            check('titre').escape().trim().notEmpty(),
            check('genres').escape().trim().notEmpty().isArray(),
            check('description').escape().trim().notEmpty(),
            check('annee').escape().trim().notEmpty().isInt({ min: 1888, max: 2024 }),
            check('realisation').escape().trim().notEmpty(),
            check('titreVignette').optional().escape().trim().notEmpty()
        ],
        async function(req,res){
            try{
                //valider la requête
                const validation = validationResult(req)
                if (validation.errors.length > 0) {
                    res.statusCode = 400
                    //return res.json({message: "erreurs dans données envoyées"})
                    return res.render('message', { message: "Erreurs dans données envoyées" })
                }

                /** récupérer les valeurs envoyés par la methode POST
                 * $_POST equals to req.body {object}
                 * {string} const titre = req.body.titre 
                 * {array}  const genres = req.body.genres
                 * {string} const description = req.body.description
                 * {string} const annee = req.body.annee (first film in year 1888)
                 * {string} const realisation = req.body.realisation
                 * {string} const titreVignette = req.body.titreVignette
                 */
                const { titre, genres, description, annee, realisation, titreVignette } = req.body

                //vérifie le titre dans la base de données
                const docRef = await db.collection('films').where('titre', '==', titre).get()
                const filmExist = []

                docRef.forEach( (doc) => {
                    filmExist.push(doc.data())
                })

                if(filmExist.length > 0){
                    res.statusCode = 400      //invalid request
                    //return res.json({message: "film déjà existe"})
                    return res.render('message', { message: "Film déjà existe" })
                }

                //enregistre dans la base de données
                const filmsRef = await db.collection('films').orderBy('id','desc').limit(1).get()
                let id = 1  
                if (!filmsRef.empty) id = filmsRef.docs[0].data().id + 1               

                const newFilm = { titre, genres, description, annee, realisation, titreVignette, "id":id }

                await db.collection('films').doc(id.toString()).set(newFilm)

                //si renvoie true
                res.statusCode = 200
                //res.json(newFilm)
                res.render('message', { message: `Film « ${newFilm.titre} » est ajouté avec succès.`})

            }catch(err){
                console.log(err)
                res.status(500).send(err)
            } 
        })

app.get(['/films/:id','/api/films/:id'], async function(req, res){
    try{
        const id = req.params.id

        //vérifie le `id` dans la base de données
        const docRef = await db.collection('films').doc(id).get()

        //si film n'existe pas
        if(!docRef.exists){
            res.statusCode = 400      //invalid request
            //return res.json({message: "film non trouvé"})
            return res.render('message', { message: "Film non trouvé" })
        }

        //si fim existe
        const filmTrouve = docRef.data()
        res.statusCode = 200
        //res.json(filmTrouve)
        res.render('film', { film : filmTrouve })

    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }
})

app.put(['/films/:id','/api/films/:id'],
        [
            check('titre').escape().trim().notEmpty(),
            check('genres').escape().trim().notEmpty().isArray(),
            check('description').escape().trim().notEmpty(),
            check('annee').escape().trim().notEmpty().isInt({ min: 1888, max: 2024 }),
            check('realisation').escape().trim().notEmpty(),
            check('titreVignette').optional().escape().trim().notEmpty(),
            check('id').optional().escape().trim().notEmpty().isInt({ min: 1 })
        ],
        async function(req,res){
            try{
                const id = req.params.id

                //vérifie le `id` dans la base de données
                const docRef = await db.collection('films').doc(id).get()

                //si id n'existe pas
                if(!docRef.exists){
                    res.statusCode = 400      //invalid request
                    return res.json({ message: "Film non trouvé pour modifier" })
                }

                //si id existe
                //valider la requête
                const validation = validationResult(req)
                if (validation.errors.length > 0) {
                    res.statusCode = 400
                    return res.json({message: "erreurs dans données envoyées"})
                }

                const donneesModifiees = req.body
                await db.collection('films').doc(id).update(donneesModifiees)
                
                res.statusCode = 200
                res.json({ message: `Le film ${id} a été modifié` })

            }catch(err){
                console.log(err)
                res.status(500).send(err)
            }  
        })

app.delete(['/films/:id','/api/films/:id'], async function(req, res){
    try{
        const id = req.params.id

        //vérifie le `id` dans la base de données
        const docRef = await db.collection('films').doc(id).get()

        if(docRef.exists){
            await db.collection('films').doc(id).delete()
            res.statusCode = 200
            return res.json({message: `Le film ${id} a été supprimé`})
        }else{
            res.statusCode = 400      //invalid request
            return res.json({message: "film n'existe pas pour supprimer"})
        }

    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }
})

//utilisateurs

app.post(['/utilisateurs/inscription','/api/utilisateurs/inscription'], //add middleware to validate request
        [
            check('username').escape().trim().notEmpty().isEmail().normalizeEmail(),
            check('password').escape().trim().notEmpty().isLength({min:8, max:20}).isStrongPassword({minLength:8, minLowercase:0, minNumbers:1, minUppercase:0, minSymbols:0})
        ],
        async function(req, res){
            try {
                //valider la requête
                const validation = validationResult(req)
                if (validation.errors.length > 0) {
                    res.statusCode = 400
                    //return res.json({message: "erreurs dans données envoyées"})
                    return res.render('message', { message: "Erreurs dans données envoyées" })
                }

                /** récupérer les valeurs envoyés par la methode POST
                 * $_POST equals to req.body {object}
                 * {string} const username = req.body.username 
                 * {string} const password = req.body.password
                 */ 
                const { username, password } = req.body

                //vérifie le username dans la base de données
                const docRef = await db.collection('user').where('username', '==', username).get()
                const userExist = []

                docRef.forEach( (doc) => {
                    userExist.push(doc.data())
                })

                if(userExist.length > 0){
                    res.statusCode = 400      //invalid request
                    //return res.json({message: "utilisateur déjà existe"})
                    return res.render('message', { message: "Utilisateur déjà existe" })
                }

                //enregistre dans la base de données
                const userRef = await db.collection('user').orderBy('id','desc').limit(1).get()
                let id = 1           
                if (!userRef.empty) id = userRef.doc[0].data().id + 1

                const newUser = { username, password , "id":id }
                await db.collection('user').doc(id.toString()).set(newUser)

                //si renvoie true
                delete newUser.password    //effacer le mot de passe
                res.statusCode = 200
                //res.json(newUser)
                res.render('message', { message: `Bonjour ${newUser.username}, votre compte est créé avec succès.`})

            }catch(err){
                console.log(err)
                res.status(500).send(err)
            }
        }
)

app.post(['/utilisateurs/connexion','/api/utilisateurs/connexion'], //add middleware to validate request
        [
            check('username').escape().trim().notEmpty().isEmail().normalizeEmail(),
            check('password').escape().trim().notEmpty().isLength({min:8, max:20}).isStrongPassword({minLength:8, minLowercase:0, minNumbers:1, minUppercase:0, minSymbols:0})
        ],
        async function(req, res){
            try{
                //valider la requête
                const validation = validationResult(req)
                if (validation.errors.length > 0) {
                    res.statusCode = 400
                    //return res.json({message: "erreurs dans données envoyées"})
                    return res.render('message', { message: "Erreurs dans données envoyées" })
                }

                /** récupérer les valeurs envoyés par la methode POST
                 * $_POST equals to req.body {object}
                 * {string} const username = req.body.username 
                 * {string} const password = req.body.password
                 */ 
                const { username, password } = req.body

                //vérifie le post dans la base de données
                const docRef = await db.collection('user').where('username', '==', username).get()
                const userExist = []

                docRef.forEach( (doc) => {
                    userExist.push(doc.data())
                })

                //si utilisateur n'existe pas
                if(userExist.length < 1){
                    res.statusCode = 400      //invalid request
                    //return res.json({message: "utilisateur n'existe pas"})
                    return res.render('message', { message: "Utilisateur n'existe pas" })
                }

                //si utilisateur existe
                const userValide = userExist[0]

                if(userValide.password !== password){
                    res.statusCode = 400
                    //return res.json({message: "Mot de passe invalide"})
                    return res.render('message', { message: "Mot de passe invalide" })
                }

                //si username & mdp sont bons
                delete userValide.password
                res.statusCode = 200
                //res.json(userValide)
                res.render('message', { message: `Bonjour ${userValide.username}, vous êtes connecté avec succès.`})

            }catch(err){
                console.log(err)
                res.status(500).send(err)
            }
        }
)

//middleware for error control -- no need for next() -- place after all routers
//==================================
app.use(function(req, res){
    res.statusCode = 404
    res.render('message', { url: req.url, message: '404' })
})


//start the server
//==================================
app.listen(3000, console.log("server is running at http://127.0.0.1:3000"))