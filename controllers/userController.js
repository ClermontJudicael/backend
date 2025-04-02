
const User = require('../models/User');

// Liste de tous les utilisateurs
const getAllUsers = async (req, res) => {
  try {
      console.log('Requête reçue avec les filtres:', req.query);

      if (req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Non autorisé. Rôle d\'administrateur requis.' });
      }

      // Analyser le filtre
      const filters = req.query.filter ? JSON.parse(req.query.filter) : {};
      console.log('Filtres analysés:', filters);

      // Gestion de la pagination (compatible avec React-Admin)
      let page = 1;
      let perPage = 10;
      
      if (req.query.range) {
          // Format React-Admin: range=[0,4] => 5 éléments (indices 0 à 4 inclus)
          const [start, end] = JSON.parse(req.query.range);
          perPage = end - start + 1;
          page = Math.floor(start / perPage) + 1;
      } else {
          // Fallback pour une pagination classique
          page = parseInt(req.query.page) || 1;
          perPage = parseInt(req.query.perPage) || 10;
      }

      // Validation des paramètres
      if (page < 1 || perPage < 1) {
          return res.status(400).json({ 
              message: 'Les paramètres de pagination doivent être des nombres positifs.' 
          });
      }

      const users = await User.getAllUsers(filters, page, perPage);
      const totalUsers = await User.countUsers(filters);

      // Calcul des indices pour Content-Range
      const firstItemIndex = (page - 1) * perPage;
      const lastItemIndex = firstItemIndex + users.length - 1;

      res.set('Content-Range', `users ${firstItemIndex}-${lastItemIndex}/${totalUsers}`);
      res.set('X-Total-Count', totalUsers);
      res.json(users);
  } catch (error) {
      console.error('Erreur dans getAllUsers:', error);
      res.status(500).json({ message: error.message });
  }
};
// Détail d'un utilisateur
const getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Ne pas envoyer le mot de passe
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Erreur dans getUserById:', error);
    res.status(500).json({ message: error.message });
  }
};
const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Seul un admin peut modifier le rôle d'un utilisateur
    if (req.body.role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé à modifier le rôle' });
    }
    
    // Les utilisateurs ne peuvent modifier que leur propre profil, sauf les admins
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Validation des données d'entrée
    const { username, email, role } = req.body;
    if (!username && !email && !role) {
      return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
    }

    // PROTECTION CONTRE LA DÉSACTIVATION DU DERNIER ADMIN
    if (role && role !== 'admin') {
      // 1. Vérifier si l'utilisateur cible est actuellement admin
      const targetUser = await User.findById(userId);
      
      if (targetUser.role === 'admin') {
        // 2. Compter le nombre d'admins
        const adminCount = await User.countAdminUsers();
        
        // 3. Si c'est le dernier admin, bloquer la modification
        if (adminCount <= 1) {
          return res.status(403).json({ 
            message: 'Action interdite : il doit rester au moins un administrateur' 
          });
        }
      }
    }

    // Appel à la méthode updateUser du modèle
    const updatedUser = await User.updateUser(userId, req.body);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Erreur dans updateUser:', error);
    res.status(500).json({ message: error.message });
  }
};

// Créer un nouvel utilisateur
const createUser = async (req, res) => {
  try {
    // Vérifiez si l'utilisateur a le rôle d'administrateur
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé. Rôle d\'administrateur requis.' });
    }

    // Validation des données d'entrée
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email et password sont requis.' });
    }

    // Vérifiez si l'email est déjà utilisé
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'L\'email est déjà utilisé.' });
    }

    // Créez l'utilisateur
    const newUser = await User.createUser({ username, email, password, role });

    // Ne pas envoyer le mot de passe dans la réponse
    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error('Erreur dans createUser:', error);
    res.status(500).json({ message: error.message });
  }
};
// Supprimer un utilisateur
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Seul un admin peut supprimer un utilisateur
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé. Rôle d\'administrateur requis.' });
    }

    // PROTECTION CONTRE LA SUPPRESSION DU DERNIER ADMIN
    const targetUser = await User.findById(userId);
    if (targetUser.role === 'admin') {
      const adminCount = await User.countAdminUsers();
      if (adminCount <= 1) {
        return res.status(403).json({
          message: 'Action interdite : il doit rester au moins un administrateur'
        });
      }
    }

    const deletedUser = await User.deleteUser(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  
  } catch (error) {
    console.error('Erreur dans deleteUser:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  createUser, 
  deleteUser
};

