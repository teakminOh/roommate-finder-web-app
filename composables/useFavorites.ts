import { ref } from 'vue'
import { useFirestore, useCollection, useCurrentUser } from 'vuefire'
import { collection, doc, query, where, setDoc, deleteDoc } from 'firebase/firestore'

export interface Property {
  title: string;
  fullDescription: string;
  price: string;
  images: string[];
}

export function useFavorites() {
  const user = useCurrentUser()
  const db = useFirestore()
  
  const favorites = useCollection(
    query(
      collection(db, 'favorites'),
      where('userId', '==', user.value?.uid || 'none')
    )
  )

  // Add a property to favorites
  const addFavorite = async (property: Property) => {
    if (!user.value) {
      alert('Please log in to add favorites');
      return;
    }

    try {
      const favoritesRef = collection(db, 'favorites');
      await setDoc(doc(favoritesRef, `${user.value.uid}_${property.title}`), {
        userId: user.value.uid,
        property,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  }

  // Remove a property from favorites
  const removeFavorite = async (property: Property) => {
    if (!user.value) return;

    try {
      const favoriteRef = doc(db, 'favorites', `${user.value.uid}_${property.title}`);
      await deleteDoc(favoriteRef);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  // Check if a property is favorited
  const isFavorited = (property: Property) => {
    return favorites.value?.some(fav => fav.property.title === property.title) ?? false;
  }

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorited
  }
} 