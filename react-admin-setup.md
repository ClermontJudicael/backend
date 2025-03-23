# Configuration de l'authentification pour React-Admin

## Installation des dépendances

```bash
npm install react-admin ra-data-simple-rest
```

## Configuration du provider d'authentification

Créez un fichier `authProvider.js` dans votre projet React-Admin:

```javascript
// src/authProvider.js
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const authProvider = {
  // Se connecter
  login: ({ username, password }) => {
    return fetch(`${apiUrl}/admin/login`, {
      method: 'POST',
      body: JSON.stringify({ email: username, password }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => {
        if (response.status < 200 || response.status >= 300) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then(auth => {
        localStorage.setItem('auth', JSON.stringify(auth));
        localStorage.setItem('token', auth.token);
        return auth;
      });
  },
  
  // Se déconnecter
  logout: () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Optionnel: notification au serveur de la déconnexion
      fetch(`${apiUrl}/admin/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Ignorer les erreurs de déconnexion
      });
    }
    
    localStorage.removeItem('auth');
    localStorage.removeItem('token');
    return Promise.resolve();
  },
  
  // Vérifier les erreurs d'authentification
  checkError: error => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('auth');
      localStorage.removeItem('token');
      return Promise.reject();
    }
    return Promise.resolve();
  },
  
  // Vérifier si l'utilisateur est connecté
  checkAuth: () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return Promise.reject();
    }
    
    // Vérifier la validité du token côté serveur
    return fetch(`${apiUrl}/admin/check-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(response => {
        if (response.status < 200 || response.status >= 300) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then(data => {
        if (!data.valid) {
          throw new Error('Token invalide');
        }
        return data;
      });
  },
  
  // Récupérer l'identité de l'utilisateur
  getIdentity: () => {
    const auth = JSON.parse(localStorage.getItem('auth'));
    
    if (!auth || !auth.user) {
      return Promise.reject('Utilisateur non connecté');
    }
    
    return Promise.resolve({
      id: auth.user.id,
      fullName: auth.user.username,
      avatar: null,
      email: auth.user.email,
    });
  },
  
  // Vérifier les permissions
  getPermissions: () => {
    const auth = JSON.parse(localStorage.getItem('auth'));
    
    if (!auth || !auth.user) {
      return Promise.reject('Utilisateur non connecté');
    }
    
    return Promise.resolve(auth.user.role);
  },
};

export default authProvider;
```

## Configuration de l'application React-Admin

Intégrez le authProvider dans votre application React-Admin:

```javascript
// src/App.js
import React from 'react';
import { Admin, Resource } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import authProvider from './authProvider';

// Vos composants de ressources (à créer)
import { UserList, UserEdit, UserCreate } from './resources/users';
// Autres ressources...

const dataProvider = simpleRestProvider('http://localhost:3001/api');

const App = () => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    title="Panel d'Administration"
  >
    <Resource name="users" list={UserList} edit={UserEdit} create={UserCreate} />
    {/* Autres ressources */}
  </Admin>
);

export default App;
```

## Configuration du client HTTP avec authentification

Pour toutes les requêtes API, vous devez inclure le token d'authentification:

```javascript
// src/httpClient.js
const httpClient = (url, options = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }
  const token = localStorage.getItem('token');
  if (token) {
    options.headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, options);
};

export default httpClient;
```

Puis modifiez votre dataProvider:

```javascript
// Dans App.js
import simpleRestProvider from 'ra-data-simple-rest';
import httpClient from './httpClient';

const dataProvider = simpleRestProvider('http://localhost:3001/api', httpClient);
```

## Sécurisation de vos routes React-Admin

Si vous avez des ressources qui nécessitent des permissions spécifiques, utilisez:

```javascript
<Resource
  name="sensitive-resource"
  list={SensitiveList}
  options={{ permissions: 'admin' }}
/>
```

Et dans vos composants:

```javascript
import { usePermissions } from 'react-admin';

const MyComponent = () => {
  const { permissions } = usePermissions();
  
  if (permissions !== 'admin') {
    return <div>Accès refusé</div>;
  }
  
  return <div>Contenu sensible</div>;
};
``` 