# API Films

## Documentation

Cette API permet de créer un utilisateur et de se connecter, ainsi que gérer une liste de films: récupérer, ajouter, modifier et supprimer des films.

**lien ver Render** <https://film-j3by.onrender.com>

**lien ver GitHub** <https://github.com/yzl-2022/API-Films.git>

___________________________________________________________________

## Routes

### récupérer tous les films

GET /api/films 

GET /api/films?tri=annee&ordre=asc

GET /api/films?tri=titre&ordre=desc

### ajouter un nouveau film

POST /api/films -- vous pouvez utiliser le formulaire sur cette page

### récupérer un film par son id

GET /api/films/:id

### modifier un film par son id

PUT /api/films/:id

### supprimer un film par son id

DELETE /api/films/:id

### créer un utilisateur

POST /api/utilisateurs/inscription -- vous pouvez utiliser le formulaire sur cette page

### connecter un utilisateur

POST /api/utilisateurs/connexion -- vous pouvez utiliser le formulaire sur cette page