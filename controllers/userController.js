
const User = require('../models/User');

// Liste de tous les utilisateurs
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé. Rôle d\'administrateur requis.' });
    }
    
    const users = await User.getAllUsers();
    res.set('Content-Range', `users 0-${users.length-1}/${users.length}`);
    res.set('X-Total-Count', users.length);
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

