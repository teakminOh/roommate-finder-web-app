import { ref } from 'vue'
import { useFirestore, useCollection, useCurrentUser } from 'vuefire'
import { collection, doc, query, where, setDoc, deleteDoc } from 'firebase/firestore'

// Updated Roommate interface with an id field
export interface Roommate {
  id: string;
  firstName: string;
  bio: string;
  budget: string;
  gender: string;
  images: string[];
}

// New Room interface for room data
export interface Room {
  id: string;
  propertyType: string;
  aboutProperty: string;
  availableFrom: string;
  bathroomType: string;
  budget: number;
  location: string;
  images: string[];
  // additional room-specific fields can be added here
}

// A union type so that favorites can be either a Roommate or a Room
export type FavoriteItem = Roommate | Room;

export function useFavorites() {
  const user = useCurrentUser();
  const db = useFirestore();

  if (!user.value) {
    return {
      favorites: ref([]),
      addFavorite: async (_item: FavoriteItem) => {},
      removeFavorite: async (_item: FavoriteItem) => {},
      isFavorited: (_item: FavoriteItem) => false
    }
  }

  // Listen to the favorites collection for the current user
  const favorites = useCollection(
    query(
      collection(db, 'favorites'),
      where('userId', '==', user.value.uid)
    ),
    { ssrKey: 'my-favs' }
  );

  // Add a favorite item (Roommate or Room)
  const addFavorite = async (item: FavoriteItem) => {
    if (!user.value) {
      return false;
    }
    try {
      const favoritesRef = collection(db, 'favorites');
      // Use the item's id to generate a unique document id
      await setDoc(doc(favoritesRef, `${user.value.uid}_${item.id}`), {
        userId: user.value.uid,
        item,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  // Remove a favorite item
  const removeFavorite = async (item: FavoriteItem) => {
    if (!user.value) return;
    try {
      const favoriteRef = doc(db, 'favorites', `${user.value.uid}_${item.id}`);
      await deleteDoc(favoriteRef);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Check if an item is already favorited by comparing the id field
  const isFavorited = (item: FavoriteItem) => {
    return favorites.value?.some(fav => fav.item.id === item.id) ?? false;
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorited
  };
}
